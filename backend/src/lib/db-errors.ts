/**
 * Códigos que indican que PostgreSQL no está accesible
 * (contenedor apagado, red caída, host incorrecto...).
 * - P1001/P1002/P1017: códigos de Prisma para "no se puede conectar" / "timeout" / "conexión cerrada".
 * - ECONNREFUSED/ETIMEDOUT/ENOTFOUND: códigos de Node que llegan a través de @prisma/adapter-pg.
 */
const UNAVAILABLE_CODES = new Set([
  "P1001",
  "P1002",
  "P1017",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
]);

/**
 * El driver `pg` lanza algunos errores de conexión sin código, solo con mensaje.
 * Ej.: con Docker Desktop, el puerto 5432 sigue aceptando conexiones aunque el
 * contenedor esté parado y las corta enseguida → "Connection terminated unexpectedly".
 */
const UNAVAILABLE_MESSAGES = /connection terminated|server has closed the connection|can't reach database server/i;

/** Devuelve true si el error significa que la base de datos no está disponible. */
export function isDatabaseUnavailable(err: unknown): boolean {
  // Recorre la cadena de `cause` por si el error viene envuelto.
  let current: unknown = err;
  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current !== "object") return false;
    const e = current as { name?: unknown; code?: unknown; message?: unknown; cause?: unknown };

    if (e.name === "PrismaClientInitializationError") return true;
    if (typeof e.code === "string" && UNAVAILABLE_CODES.has(e.code)) return true;
    if (typeof e.message === "string" && UNAVAILABLE_MESSAGES.test(e.message)) return true;

    current = e.cause;
  }
  return false;
}
