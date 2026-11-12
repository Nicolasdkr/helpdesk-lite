import { execSync } from "node:child_process";
import { TEST_DATABASE_URL } from "./test-env.js";

/** Se ejecuta una vez antes de todos los tests: aplica las migraciones a la BD de test. */
export default function setup() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
