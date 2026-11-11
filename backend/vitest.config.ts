import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./tests/setup/test-env.js";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/setup/global-setup.ts"],
    // Todos los tests comparten una base de datos: se ejecutan en serie.
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: "test-secret-que-solo-se-usa-en-los-tests-0123456789",
      JWT_EXPIRES_IN: "1h",
    },
  },
});
