import crypto from "crypto";
import sha1 from "sha1";
import { UserDao } from "../dao/UserDao";
import User from "../models/User";
import { UserPayment } from "../models/UserPayment";
import ServiceError from "../utils/ServiceError";
import { validateLegacyPassword } from "./AuthenticationService";
import UserDatabaseObject from "../interfaces/UserDatabaseObject";
import { hashPasswordAsync, validatePasswordHashAsync } from "../utils/UserHelpers";
import NatsService, { ConsumerAbortSignal } from "../services/NatsService";
import { JetStreamPublishOptions, JsMsg, headers, JsHeaders, PubAck } from "nats";
import z from "zod";
import { isEqual } from "lodash";

const UserFields = z.record(z.string(), z.any()).transform(v => v as UserDatabaseObject);

const PartialUserFields = z.record(z.string(), z.any()).transform(v => v as Partial<UserDatabaseObject>);

const UserCreateEvent = z.object({
  type: z.literal("create"),
  user: z.number(),
  fields: UserFields,
});

const UserImportEvent = z.object({
  type: z.literal("import"),
  user: z.number(),
  fields: UserFields,
});

const UserSetEvent = z.object({
  type: z.literal("set"),
  user: z.number(),
  fields: PartialUserFields,
  subject: z.number().optional(),
});

const UserDeleteEvent = z.object({
  type: z.literal("delete"),
  user: z.number(),
});

const UserEvent = z.discriminatedUnion("type", [UserCreateEvent, UserImportEvent, UserSetEvent, UserDeleteEvent]);

type UserEvent = z.infer<typeof UserEvent>;

type RebuildOptions = {
  allowChanges?: Array<keyof UserDatabaseObject>;
  allowRemove?: boolean;
  allowCreate?: boolean;
};

class UserService {
  abortSignal?: ConsumerAbortSignal;

  dao: UserDao;

  constructor(dao?: UserDao) {
    this.dao = dao ?? new UserDao();
  }

  private async publish(
    subject: string,
    payload: UserEvent,
    options?: Partial<JetStreamPublishOptions>,
    wait?: boolean,
  ): Promise<PubAck> {
    const nats = await NatsService.get();
    return nats.publish(subject, UserEvent.parse(payload), options, wait);
  }

  public async fetchUser(userId: number): Promise<User> {
    const result = await this.dao.findOne(userId);
    if (!result) {
      throw new ServiceError(404, "User not found");
    }

    return new User(result);
  }

  public async fetchAllUsers(): Promise<User[]> {
    const results = await this.dao.findAll();
    return results.map(dbObj => new User(dbObj));
  }

  public async fetchAllUnpaidUsers(): Promise<User[]> {
    const results = await this.dao.findAllByUnpaidPayment();
    return results.map(dbObj => new User(dbObj));
  }

  /**
   * Searches all users with the given SQL WHERE condition.
   */
  public async searchUsers(searchTerm: string): Promise<User[]> {
    const results = await this.dao.findWhere(searchTerm);
    if (!results.length) {
      return this.fetchAllUsers();
    }

    return results.map(res => new User(res));
  }

  /**
   * Fetches users with selected fields and those who match the conditions.
   */
  public async fetchAllWithSelectedFields(fields?: string[], conditions?: string[]): Promise<UserPayment[]> {
    let conditionQuery: string[] = [];
    if (conditions) {
      conditionQuery = [];
      conditions.forEach(condition => {
        switch (condition) {
          case "member":
            conditionQuery.push("(membership <> 'ei-jasen' and membership <> 'erotettu')");
            break;
          case "nonmember":
            conditionQuery.push("(membership = 'ei-jasen' or membership = 'erotettu')");
            break;
          case "paid":
            conditionQuery.push("paid is not null");
            break;
          case "nonpaid":
            conditionQuery.push("(paid is null)");
            break;
          case "revoked":
            conditionQuery.push("deleted = 1");
            break;
          default:
            break;
        }
      });
    }

    const results = await this.dao.findAll(fields, conditionQuery);

    return results.map(u => new UserPayment(u));
  }

  public async getUserWithUsernameAndPassword(username: string, password: string): Promise<User> {
    const dbUser = await this.dao.findByUsername(username);
    if (!dbUser) {
      throw new ServiceError(404, "User not found");
    }

    const user = new User(dbUser);

    // if user has bcrypt hash instead of the legacy hash
    if (user.passwordHash) {
      if (await validatePasswordHashAsync(password, user.passwordHash)) {
        return user;
      }

      throw new ServiceError(401, "Invalid username or password");
    }

    const isPasswordCorrect = await validateLegacyPassword(password, user.salt, user.hashedPassword);
    if (isPasswordCorrect) {
      return user;
    }

    throw new ServiceError(401, "Invalid username or password");
  }

  public async tryReserveUsername(username: string): Promise<boolean> {
    try {
      await this.dao.reserveUsername(username);
      return true;
    } catch (err) {
      if (typeof err === "object" && err && "code" in err && err.code === "ER_DUP_ENTRY") {
        return false;
      }

      throw err;
    }
  }

  public async tryReserveEmail(email: string): Promise<boolean> {
    try {
      await this.dao.reserveEmail(email);
      return true;
    } catch (err) {
      if (typeof err === "object" && err && "code" in err && err.code === "ER_DUP_ENTRY") {
        return false;
      }

      throw err;
    }
  }

  public async createUser(userData: User, rawPassword: string, wait = true): Promise<number> {
    let usernameCaptured = false;
    let emailCaptured = false;

    try {
      emailCaptured = await this.tryReserveEmail(userData.email);

      if (!emailCaptured) {
        throw new ServiceError(400, "Email address already in use!");
      }

      usernameCaptured = await this.tryReserveUsername(userData.username);

      if (!usernameCaptured) {
        throw new ServiceError(400, "Username already in use!");
      }

      const presetId = typeof userData.id === "number" && userData.id > 0 ? userData.id : undefined;

      userData.id = await this.dao.reserveId(presetId);

      const { password, salt } = await mkHashedPassword(rawPassword);
      userData.hashedPassword = password;
      userData.salt = salt;
      userData.passwordHash = await hashPasswordAsync(rawPassword);

      await this.publish(
        `members.${userData.id}`,
        {
          type: "create",
          user: userData.id,
          fields: userData.getDatabaseObject(),
        },
        undefined,
        wait,
      );

      return userData.id;
    } catch (err) {
      if (emailCaptured) {
        await this.dao.releaseEmail(userData.email);
      }

      if (usernameCaptured) {
        await this.dao.releaseUsername(userData.username);
      }

      throw err;
    }
  }

  public async updateUser(
    userId: number,
    updatedUser: Partial<UserDatabaseObject>,
    rawPassword?: string,
    subject?: User,
  ): Promise<number> {
    let emailReserved = false;
    let usernameReserved = false;

    try {
      const fields = { ...updatedUser };

      const oldUser = await this.fetchUser(userId);

      if (updatedUser.email !== undefined && oldUser.email !== updatedUser.email) {
        emailReserved = await this.tryReserveEmail(updatedUser.email);

        if (!emailReserved) {
          throw new ServiceError(400, "Email already in use!");
        }
      }

      if (updatedUser.username !== undefined && oldUser.username !== updatedUser.username) {
        usernameReserved = await this.tryReserveUsername(updatedUser.username);

        if (!usernameReserved) {
          throw new ServiceError(400, "Username already in use!");
        }
      }

      if (rawPassword) {
        const { password, salt } = await mkHashedPassword(rawPassword);
        const passwordHash = await hashPasswordAsync(rawPassword);

        Object.assign(fields, {
          password_hash: passwordHash,
          hashed_password: password,
          salt,
        });
      }

      const user = await this.fetchUser(userId);

      // Kerrotaan NATS-palvelimelle, että tämä on viimeisin käsittelemämme
      // tätä käyttäjää koskevan viestin järjestysnumero. Jos NATS-vastaanottaa
      // tämän viestin, ja viimeisimmän käyttäjää koskevan viestin sarjanumero on jokin muu,
      // NATS kieltäytyy vastaanottamasta viestiä.
      //
      // Näin voimme varmistua siitä, että lähtötietomme on ajantasainen,
      // eikä joku muu ole kerennyt tässä välissä muokata käyttäjän tietoja.
      const opts: Partial<JetStreamPublishOptions> = {
        expect: {
          lastSubjectSequence: user.lastSeq,
        },
      };

      const changedFields = Object.entries(fields).filter(
        ([field, newValue]) => user.getDatabaseObject()[field as keyof UserDatabaseObject] !== newValue,
      );

      if (changedFields.length === 0) {
        return 0;
      }

      // Jukaistaan viesti, jossa kerrotaan, että asetamme käyttäjälle uudet pyynnön mukana saadut arvot.
      await this.publish(
        `members.${userId}`,
        {
          type: "set",
          user: userId,
          fields: Object.fromEntries(changedFields) as Partial<UserDatabaseObject>,
          subject: subject?.id,
        },
        opts,
        true,
      );

      if (usernameReserved) {
        await this.dao.releaseUsername(oldUser.username);
      }

      if (emailReserved) {
        await this.dao.releaseEmail(oldUser.email);
      }

      return 1;
    } catch (err) {
      if (usernameReserved) {
        await this.dao.releaseUsername(updatedUser.username!);
      }

      if (emailReserved) {
        await this.dao.releaseEmail(updatedUser.email!);
      }

      throw err;
    }
  }

  public async deleteUser(userId: number): Promise<number> {
    const user = await this.dao.findOne(userId);

    if (!user) {
      throw new ServiceError(404, "User not found");
    }

    const nats = await NatsService.get();

    const options = {
      headers: headers(),
      expect: {
        lastSubjectSequence: user.last_seq,
      },
    };

    options.headers?.append(JsHeaders.RollupHdr, JsHeaders.RollupValueSubject);

    await nats.publish(`members.${userId}`, { type: "delete", user: userId }, options, true);

    return 1;
  }

  public async getUserWithUsername(username: string): Promise<User | null> {
    const dbUser = await this.dao.findByUsername(username);
    if (!dbUser) return null;
    const user = new User(dbUser);
    return user;
  }

  public async getUserWithEmail(email: string): Promise<User | null> {
    const dbUser = await this.dao.findByEmail(email);
    if (!dbUser) return null;
    const user = new User(dbUser);
    return user;
  }

  public async restart() {
    await this.stop();
    await this.start();
  }

  public async stop() {
    await this.abortSignal?.abort();
  }

  public async start() {
    await this.listen();
  }

  private transaction(callback: (txs: UserService) => Promise<void>) {
    return this.dao.withTransaction(dao => callback(new UserService(dao)));
  }

  public async rebuild(options?: RebuildOptions) {
    const nats = await NatsService.get();

    await this.transaction(async tsx => {
      const usersBefore = new Map(
        (await tsx.dao.findAll()).map(user => [user.id, user] as [number, UserDatabaseObject]),
      );

      await tsx.dao.clear();
      await nats.fetch("members.*", async msg => {
        const data = msg.json();
        await tsx.handleMessage(data, msg);
      });

      let error = false;

      const usersAfter = new Map(
        (await tsx.dao.findAll()).map(user => [user.id, user] as [number, UserDatabaseObject]),
      );

      const ids = new Set([...usersBefore.keys(), ...usersAfter.keys()]);

      ids.forEach(id => {
        const before = usersBefore.get(id);
        const after = usersAfter.get(id);

        if (!after && before) {
          console.log(`User ${before.id} (${before.username}) disappeared during rebuild!`);

          if (!options?.allowRemove) error = true;

          return;
        }

        if (!before && after) {
          console.log(`New user ${after.id} (${after.username}) appeared during rebuild!`);

          if (!options?.allowCreate) error = true;

          return;
        }

        if (!before || !after) {
          throw new Error("Unreachable.");
        }

        if (!isEqual(before, after)) {
          const diff = Object.entries(before).flatMap(([key, beforeValue]) => {
            const afterValue = after[key as keyof UserDatabaseObject];

            if (isEqual(beforeValue, afterValue)) {
              return [];
            }

            return [[key, beforeValue, afterValue]];
          });

          if (diff.length === 0) {
            console.log(`User ${id} changed during rebuild!`);
          } else {
            diff.forEach(([key, before, after]) => {
              console.log(`Field ${key} of user ${id} changed: ${before} -> ${after}`);
            });
          }

          if (options?.allowChanges) {
            for (const [key] of diff) {
              if (!options.allowChanges.includes(key)) {
                console.log(`Unallowed field ${key} changed for user ${key}!`);
                error = true;
              }
            }
          }
        }
      });

      if (usersAfter.size !== usersBefore.size) {
        console.log(
          `User count does not match before (${usersBefore.size}) and after (${usersAfter.size}) the rebuild.`,
        );
      }

      if (error) {
        throw new Error("Abnormalities were detected after the rebuild. Rolling back...");
      }
    });
  }

  public async handleMessage(pEvent: unknown, msg: JsMsg) {
    const event = UserEvent.parse(pEvent);

    const userId = parseInt(msg.subject.split(".")[1], 10);

    if (event.type === "set") {
      // Parsitaan käyttäjän ID viestin subjektista, joka on muotoa `members.{id}`.

      if (event.fields.created) {
        event.fields.created = new Date(event.fields.created);
      }

      if (event.fields.registration_ban_bypass_until) {
        event.fields.registration_ban_bypass_until = new Date(event.fields.registration_ban_bypass_until);
      }

      // Päivitetään muokkausviestin mukaiset arvot tietokantaan.
      await this.dao.update(userId, {
        ...event.fields,
        modified: event.fields.modified ?? new Date(msg.info.timestampNanos / 1000000),
        last_seq: msg.seq,
      });
    } else if (event.type === "create" || event.type === "import") {
      if (event.fields.created) {
        event.fields.created = new Date(event.fields.created);
      }

      if (event.fields.modified) {
        event.fields.modified = new Date(event.fields.modified);
      }

      await this.dao.save({
        ...event.fields,
        modified: event.fields.modified ?? new Date(msg.info.timestampNanos / 1000000),
        id: userId,
        last_seq: msg.seq,
      });

      return;
    } else if (event.type === "delete") {
      await this.dao.remove(userId);
      return;
    } else {
      // Tallennetaan tietokantaan tieto siitä, että olemme käsitelleet tämän viestin,
      // vaikka viesti ei olisikaan meille relevantti.
      await this.dao.update(userId, { last_seq: msg.seq });
    }
  }

  /**
   * Taustaprosessi, joka kuuntelee jäsentieto-streamiin julkaistuja viestejä
   * ja käsittelee ne.
   */
  public async listen() {
    const nats = await NatsService.get();

    this.abortSignal = new ConsumerAbortSignal();

    return new Promise<void>(resolve => {
      nats.subscribe((data, msg) => this.transaction(service => service.handleMessage(data, msg)), {
        onReady: () => resolve(),
        signal: this.abortSignal,
      });
    });
  }
}

async function mkHashedPassword(rawPassword: string): Promise<{ salt: string; password: string }> {
  const salt = crypto.randomBytes(16).toString("hex").substring(0, 20);
  // The passwords are first hashed according to the legacy format
  // to ensure backwards compability
  const password = sha1(`${salt}kekbUr${rawPassword}`) as string;
  return { salt, password };
}

const service = new UserService();

export default service;
