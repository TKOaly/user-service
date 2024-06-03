import "mocha";
import { assert } from "chai";
import NatsService from "../../src/services/NatsService";

describe("NatsService", () => {
  beforeEach(async () => {
    const nats = await NatsService.get();
    await nats.reset();
  });

  it("Should be able to initialize the service", async () => {
    const nats = await NatsService.get();
    assert.exists(nats);
  });

  it("Should be able to publish messages", async () => {
    const nats = await NatsService.get();
    await nats.publish("members.test", { data: 123 });
  });

  it("Should be able to receive published messages", async () => {
    const nats = await NatsService.get();

    let setSent!: (seq: number) => void;

    const sent: Promise<number> = new Promise(resolve => (setSent = resolve));

    const promise = new Promise<void>(resolve => {
      nats.subscribe(async (payload: unknown, msg) => {
        const sentSeq = await sent;

        if (msg.seq !== sentSeq) return;

        assert.exists(payload);
        assert.hasAllKeys(payload, {
          data: 321,
        });

        resolve();

        return false;
      });
    });

    const ack = await nats.publish("members.test", { data: 321 });
    setSent(ack.seq);

    await promise;
  });

  it("Should be able to fetch message history", async () => {
    const nats = await NatsService.get();

    for (let i = 0; i < 5; i++) {
      await nats.publish("members.test", { data: i });
    }

    const messages = await nats.fetch("members.test");

    assert.lengthOf(messages, 5);

    for (let i = 0; i < 5; i++) {
      const data = messages[i].json();
      assert.deepEqual(data, { data: i });

      if (i > 0) {
        assert.isAtLeast(messages[i].info.timestampNanos, messages[i - 1].info.timestampNanos);
      }
    }
  });
});
