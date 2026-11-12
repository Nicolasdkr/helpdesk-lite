import request from "supertest";
import { createApp } from "../src/app.js";
import type { Role } from "../src/generated/prisma/client.js";
import { hashPassword } from "../src/lib/password.js";
import { prisma } from "../src/lib/prisma.js";

export const app = createApp();

/** Vacía las tablas (en orden, respetando las claves foráneas). */
export async function resetDb() {
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
}

/** Crea un usuario directamente en la BD y devuelve un token válido para él. */
let userCounter = 0;

export async function createUserAndLogin(role: Role = "USER") {
  const email = `${role.toLowerCase()}-${Date.now()}-${++userCounter}@test.dev`;
  const password = "Password123!";
  const user = await prisma.user.create({
    data: { name: `Test ${role}`, email, role, passwordHash: await hashPassword(password) },
  });

  const res = await request(app).post("/api/auth/login").send({ email, password });
  const token = res.body.token as string;
  return { id: user.id, email, token, auth: { Authorization: `Bearer ${token}` } };
}
