import { describe, test, beforeEach, expect } from "vitest";
import NatsService from "../../src/services/NatsService";

describe("NatsService", () => {
  beforeEach(async () => {
    const nats = await NatsService.get();
    await nats.reset();
  });

  test("Should be able to initialize the service", async () => {
    const nats = await NatsService.get();
    expect(nats).toBeDefined();
  });

  test("Should be able to publish messages", async () => {
    const nats = await NatsService.get();
    await nats.publish("members.test", { data: 123 });
  });

  test("Should be able to receive published messages", async () => {
    const nats = await NatsService.get();

    let setSent!: (seq: number) => void;

    const sent: Promise<number> = new Promise(resolve => (setSent = resolve));

    const promise = new Promise<void>(resolve => {
      nats.subscribe(async (payload: unknown, msg) => {
        const sentSeq = await sent;

        if (msg.seq !== sentSeq) return;

        expect(payload).toBeDefined();
        expect(payload).toMatchObject({
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

  test("Should be able to fetch message history", async () => {
    const nats = await NatsService.get();

    for (let i = 0; i < 5; i++) {
      await nats.publish("members.test", { data: i });
    }

    const messages = await nats.fetch("members.test");

    expect(messages).toHaveLength(5);

    for (let i = 0; i < 5; i++) {
      const data = messages[i].json();
      expect(data).toEqual({ data: i });

      if (i > 0) {
        expect(messages[i].info.timestampNanos).toBeGreaterThanOrEqual(messages[i - 1].info.timestampNanos);
      }
    }
  });
});
