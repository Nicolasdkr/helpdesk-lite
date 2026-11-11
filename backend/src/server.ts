import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// Cierre ordenado: deja de aceptar conexiones y libera el pool de la base de datos.
const shutdown = (signal: string) => {
  console.log(`\n${signal} recibido, cerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
