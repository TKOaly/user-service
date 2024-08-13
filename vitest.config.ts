import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/***/*.test.ts"],
    pool: "forks",
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 1,
      },
    },
  },
});
