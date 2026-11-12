// Los tests usan una base de datos propia (helpdesk_test) para no tocar
// los datos de desarrollo. En CI se sobrescribe con TEST_DATABASE_URL.
export const TEST_DATABASE_URL =
  process.env["TEST_DATABASE_URL"] ??
  "postgresql://helpdesk:helpdesk@localhost:5432/helpdesk_test?schema=public";
