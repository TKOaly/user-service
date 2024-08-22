import {
  AckPolicy,
  connect,
  DeliverPolicy,
  JetStreamPublishOptions,
  JsMsg,
  NatsConnection,
  RetentionPolicy,
} from "nats";
import { EventEmitter } from "node:stream";

const STREAM = "members";
const ACK_STREAM = "members-ack";
const CONSUMER = "user-service";

export class ConsumerAbortSignal extends EventEmitter {
  private abortedPromise: Promise<void>;
  private aborted: boolean = false;

  private resolve!: () => void;

  constructor() {
    super();

    this.abortedPromise = new Promise(resolve => {
      this.resolve = resolve;
    });
  }

  async abort() {
    if (this.aborted) return;
    this.emit("abort");
    return this.abortedPromise;
  }

  handle(handler: () => Promise<unknown>) {
    this.on("abort", async () => {
      await handler();
      this.resolve();
    });
  }
}

/**
 * Luokka, joka vastaa NATS-palvelun kanssa keskustelemisesta.
 *
 * Koska yhteyden alustaminen vaatii async-toiminnallisuutta,
 * tämän tämän luokan singleton instanssi täytyy pyytää staattisen
 * {@link get}-metodin avulla.
 */
export default class NatsService {
  /** Tämän luokan globaali singleton-instanssi. */
  static _singleton: NatsService | Promise<NatsService> | null = null;

  /** NATS-yhteys. */
  private conn!: NatsConnection;

  /**
   * Palauttaa tämän luokan globaalin singleton-instanssin, jos se on alustettu.
   * Muussa tapauksessa luo instanssin ja alustaa sen ennen palauttamista.
   */
  static async get(): Promise<NatsService> {
    if (NatsService._singleton !== null) {
      return Promise.resolve(NatsService._singleton);
    }

    return (NatsService._singleton = (async () => {
      const instance = new NatsService();
      await instance.init();
      NatsService._singleton = instance;
      return instance;
    })());
  }

  /**
   * Alustaa yhteyden NATS-palveluun.
   */
  private async init() {
    // Muodostetaan yhteys NATS-palveluun.
    const host = process.env.NATS_HOST ?? "localhost";
    const port = process.env.NATS_PORT ?? 4222;
    const user = process.env.NATS_USER;
    const pass = process.env.NATS_PASSWORD;

    this.conn = await connect({
      servers: `${host}:${port}`,
      user,
      pass,
    });

    await this.setup();
  }

  private async setup() {
    // Luodaan tarvittavat JetStream streamit ja consumerit.

    const jsm = await this.conn.jetstreamManager();

    // Streamit ovat sarja keskenään tiukasti järjestettyjä viestejä.
    //
    // Jokaisella streamiin kuuluvalla viestillä on mm. seuraavat tietueet:
    //   - `seq`: streamin sisäinen viestin järjestysnumero
    //   - `timestamp`: aikaleima jolloin NATS-palvelin vastaanotti viestin
    //   - `subject`: viestin "otsikko" tai "tyyppi", esim. `members.1.deleted`
    //   - `data`: viestin sisältö binäärimuodossa

    // Luodaan streami jäsentietomuutosten säilyttämistä varten.
    await jsm.streams.add({
      name: STREAM,

      // Streamin luomisen yhteydessä määritellään siihen kuuluvat subjektit.
      // Subjekti koostuu pisteillä erotetuista sanoista.
      //
      // Tässä, ja monessa muussa yhteydessä tuetaan kahden laista wildcard-syntaksia:
      //   - *: mikä tahansa yksittäinen sana
      //   - >: mikä tahansa yksi tai useampi sana
      //
      // Tähän streamiin sisällytetään automaattisesti kaikki julkaistut viestit,
      // joiden subjekt vastaa jotakin alla listatuista malleista.
      //
      // Tässä tapauksessa kaikki `members.`-alkuisilla subjekteilla varustetut viestit
      // kuuluvat tähän streamiin.
      subjects: ["members.>"],

      allow_rollup_hdrs: true,
    });

    // Luodaan lisäksi streami palvelukohtaisia vahvistusviestejä varten.
    await jsm.streams.add({
      name: ACK_STREAM,

      // Tähän streamiin kuuluvat kaikki `ack.`-alkuiset kolmen tokenin mittaiset subjektit omaavat viestit.
      // Esimerkiksi:
      //   - `ack.1234.user-service`: Palvelu "user-service" vahvistaa käsitelleensä viestin numero 1234
      //   - `ack.1337.baseball-bat`: Palvelu "baseball-bat" vahvistaa käsitelleensä viestin numero 1337
      subjects: ["ack.*.*"],

      // Ohjeistetaan NATS-palvelinta säilyttämään tässä streamissa olevat viestit vain niin
      // kauan kun niistä kiinnostuneita consumereita on olemassa. Viestejä ei siis tallenneta,
      // jos mikään taho ei ole niistä kiinnostunut ja ne poistetaan heti käsittelynsä jälkeen.
      retention: RetentionPolicy.Interest,
    });

    // Luodaan consumeri, joka lukee jäsentiedot sisältävään streamiin lähetettyjä viestejä.
    await jsm.consumers.add(STREAM, {
      // Consumerit, jotka ovat pysyviä (durable), persistoidaan NATS-palvelimen puolella.
      // Meidän ei siis itse tarvitse pitää kirjaa siitä, mitkä viestit olemme nähneet tai käsitelleet,
      // vaan NATS-pitää niistä kirjaa myös uudelleenkäynnistysten yli.
      durable_name: CONSUMER,

      // Ohjeistetaan NATS-palvelinta odottamaan manuaalista vahvistusta viestin käsittelyn
      // onnistumisesta. Jos emme lähetä viestin käsittelyn jälkeen vahvistusviestiä NATS-palvelimelle,
      // pavlvelin yrittää viestin lähettämistä uudestaan jonkin ajan kuluttua.
      ack_policy: AckPolicy.Explicit,
    });
  }

  public async reset() {
    const jsm = await this.conn.jetstreamManager();
    await jsm.streams.purge(STREAM);
    await jsm.streams.purge(ACK_STREAM);
    await jsm.consumers.delete(STREAM, CONSUMER);
    await this.setup();
  }

  /**
   * Lähtettään NATS-palvelimelle julkaistavan viestin.
   */
  public async publish(subject: string, message?: unknown, options?: Partial<JetStreamPublishOptions>, wait = false) {
    const js = this.conn.jetstream();

    try {
      let c;

      if (wait) {
        // Luodaan väliaikainen consumeri, jota ei persistoida NATS-palvelimen puolesta, joka
        // kuuntelee meidän itsemme lähettämiä vahvistusviestejä.
        c = await js.consumers.get("members-ack", {
          filterSubjects: "ack.*.user-service",
          deliver_policy: DeliverPolicy.New,
        });
      }

      // Muutetaan saatu viesti JSON-muotoon ja edelleen UTF-8 binääriksi,
      // jonka jälkeen lähetetään se NATS-palvelimelle.
      const encoded = message ? new TextEncoder().encode(JSON.stringify(message)) : undefined;
      const msg = await js.publish(subject, encoded, options);

      if (wait && c) {
        // Odotetaan, kunnes juuri lähetettyä viestiä vastaava vahvistusviesti
        // julkaistaan.
        for await (const message of await c.consume()) {
          const parts = message.subject.split(".");

          if (parts[1] === msg.seq.toString()) {
            break;
          }
        }

        // Jonka jälkeen tuhoamme väliaikaisen consumerin, joka vapauttaa
        // palvelimen poistamaan vahvistusviesti-streamissa olevat viestit.

        await c.delete();
      }

      return msg;
    } catch (err) {
      console.error("Publishing failed:", err);
      throw err;
    }
  }

  /**
   * Kuuntelee jäsentietostreamiin julkaistavia viestejä ja käsittelee ne annetun
   * funktion avulla.
   */
  public async subscribe(
    handler: (data: unknown, message: JsMsg) => Promise<boolean | void> | boolean | void,
    options?: {
      onReady?: () => void;
      signal?: ConsumerAbortSignal;
    },
  ) {
    const js = this.conn.jetstream();

    // Hankitaan kahva persistoituun consumeriin.
    // Saamme siis tämän avulla vain viestejä, joita emme ole aikaisemmin käsitelleet.
    const c2 = await js.consumers.get(STREAM, CONSUMER);

    options?.onReady?.();

    const messages = await c2.consume();

    options?.signal?.handle(() => messages.close());

    for await (const message of messages) {
      const data = message.json();

      try {
        // Kerrotaan palvelimelle, että viestin käsittely on aloitettu,
        // jolloin timeout-ajastin nollataan.
        message.working();

        // Käsitellään viesti.
        const result = await Promise.resolve(handler(data, message));

        // Julkaistaan vahvistusviesti, jotta viestin julkaisija voi halutessaan
        // tietää, että olemme sen käsitelleet.
        await js.publish(`ack.${message.seq}.user-service`);

        // Kerrotaan palvelimelle, että viestin käsittely onnistui, eikä sitä tarvitse lähettää uudestaan.
        message.ack();

        if (result === false) break;
      } catch (err) {
        // Kerrotaan palvelimelle, että jokin meni pieleen ja viestin lähettämistä tulisi yrittää uudelleen myöhemmin.
        message.nak();

        throw err;
      }
    }
  }

  /**
   * Hakee palvelimelta annetulla subjektilla varustetut viestit jäämättä odottamaan uusia viestejä.
   *
   * Tämän toteutus on jotenkin vaikeampi kuin NATS muuten antaisi olettaa,
   * joten luulen että tähän on joku fiksumpikin tapa.
   */
  public async fetch(subject: string): Promise<JsMsg[]> {
    const js = this.conn.jetstream();

    // Haetaan palvelimelta subjektin viimeisin viesti,
    // jotta saamme sen järjestysnumeron.
    const c1 = await js.consumers.get(STREAM, {
      // Haluamme vain subjektin viimeisimmän viestin.
      deliver_policy: DeliverPolicy.LastPerSubject,

      // Haluamme vain yhden subjektin viestin.
      filterSubjects: [subject],
    });

    // Vastaanottaa yhden viestin.
    const last = await c1.next();

    if (!last) return [];

    // Haetaan subjektin kaikki viestit.
    const consumer = await js.consumers.get(STREAM, {
      // Haluamme kaikki viestit alkaen ...
      deliver_policy: DeliverPolicy.StartSequence,
      // ... järjestysnumerosta 0, eli aikojen alusta.
      opt_start_seq: 0,
      // Haluamme vain viestit, jotka ovat annetulla subjektilla varustettuja.
      filterSubjects: [subject],
    });

    const results = [];

    while (true) {
      // Haetaan viesti kerrallaan.
      const msg = await consumer.next();

      // Ilmeisesti sieltä voi tulla myös null, en tiedä miksi.
      if (!msg) break;

      // Jos se ei ollut null, niin sitten otetaan se talteen.
      results.push(msg);

      // Jos viestin järjestysnumero vastaa aiemmin hakemaamme viimeistintä viestiä,
      // lopetetaan viestien hakeminen.
      //
      // Tämän ei pitäisi olla tarpeellista, vaan NATS-ille pitäisi pystyä sanomaan myös,
      // että emme halua odottaa uusia viestejä. Enpäs saanut toimimaan, niin tehdään sitten näin.
      if (msg.seq === last.seq) {
        break;
      }
    }

    // Vapautetaan meidän ote consumerista.
    // Huom. tämä ei poista koko persistoitua consumeria NATS-palevlimen puolelta.
    await consumer.delete();

    return results;
  }
}
