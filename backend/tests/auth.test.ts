import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { app, createUserAndLogin, resetDb } from "./helpers.js";

const validUser = { name: "Nuevo Usuario", email: "Nuevo@Test.dev", password: "Password123!" };

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("POST /api/auth/register", () => {
  it("crea un usuario con rol USER y devuelve un token", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: "nuevo@test.dev", role: "USER" });
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("no permite elegir el rol al registrarse", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, role: "ADMIN" });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("USER");
  });

  it("guarda la contraseña hasheada, nunca en texto plano", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "nuevo@test.dev" } });

    expect(user.passwordHash).not.toBe(validUser.password);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("responde 409 si el email ya está registrado", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(409);
  });

  it("responde 400 con el detalle de los campos inválidos", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "A", email: "no-es-un-email", password: "123" });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details)).toEqual(
      expect.arrayContaining(["name", "email", "password"]),
    );
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(validUser);
  });

  it("devuelve un token con credenciales correctas", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("responde 401 con contraseña incorrecta", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "incorrecta" });

    expect(res.status).toBe(401);
  });

  it("responde 401 con el mismo mensaje si el email no existe", async () => {
    const wrongPass = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "incorrecta" });
    const noUser = await request(app)
      .post("/api/auth/login")
      .send({ email: "nadie@test.dev", password: "incorrecta" });

    expect(noUser.status).toBe(401);
    expect(noUser.body.error.message).toBe(wrongPass.body.error.message);
  });
});

describe("GET /api/auth/me", () => {
  it("devuelve el perfil del usuario autenticado", async () => {
    const { email, token } = await createUserAndLogin("AGENT");
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email, role: "AGENT" });
  });

  it("responde 401 sin token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("responde 401 con un token alterado", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer token.falso.123");
    expect(res.status).toBe(401);
  });
});

describe("Autorización por rol — GET /api/users", () => {
  it("permite el acceso a un ADMIN", async () => {
    const { token } = await createUserAndLogin("ADMIN");
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]).not.toHaveProperty("passwordHash");
  });

  it.each(["USER", "AGENT"] as const)("responde 403 a un %s", async (role) => {
    const { token } = await createUserAndLogin(role);
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
