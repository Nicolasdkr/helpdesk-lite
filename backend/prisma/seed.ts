/**
 * Datos de ejemplo para desarrollo: un usuario por rol.
 * Ejecutar con: npm run db:seed
 * Es idempotente: se puede ejecutar varias veces sin duplicar datos.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient, type Role } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

const DEMO_PASSWORD = "Password123!";

const users: { name: string; email: string; role: Role }[] = [
  { name: "Ana Admin", email: "admin@helpdesk.dev", role: "ADMIN" },
  { name: "Tomás Técnico", email: "agent@helpdesk.dev", role: "AGENT" },
  { name: "Elena Empleada", email: "user@helpdesk.dev", role: "USER" },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  console.log(`🌱 Seed completado. Usuarios demo (contraseña: ${DEMO_PASSWORD}):`);
  users.forEach((u) => console.log(`   ${u.role.padEnd(5)} → ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
