import { Worker, isMainThread, parentPort } from "worker_threads";

const READY_MESSAGE = "READY";
const READY_TIMEOUT = 10_000;

export const start = () =>
  new Promise<Worker>((resolve, reject) => {
    const worker = new Worker(__filename);

    setTimeout(() => reject(new Error("Timeout while starting worker.")), READY_TIMEOUT);

    worker.addListener("message", message => {
      if (message === READY_MESSAGE) {
        resolve(worker);
      }
    });

    worker.addListener("error", err => {
      console.log("Worker threw an error while starting:", err);
    });

    worker.addListener("exit", reject);
  });

const run = async () => {
  const UserService = (await import("./UserService")).default;
  await UserService.listen();
  parentPort?.postMessage(READY_MESSAGE);
};

if (!isMainThread) {
  run();
}
