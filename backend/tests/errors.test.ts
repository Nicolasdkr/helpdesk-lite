import request from "supertest";
import { describe, expect, it } from "vitest";
import { isDatabaseUnavailable } from "../src/lib/db-errors.js";
import { app } from "./helpers.js";

describe("Manejo de errores HTTP", () => {
  it("responde 400 (no 500) si el JSON está mal formado", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":"a@b.dev",}');

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/JSON/);
  });

  it("responde 413 si el cuerpo supera el límite", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.dev", password: "x".repeat(200_000) });

    expect(res.status).toBe(413);
  });
});

describe("isDatabaseUnavailable", () => {
  it("detecta una conexión rechazada (forma real que lanza @prisma/adapter-pg)", () => {
    const err = Object.assign(new Error("connect"), {
      name: "PrismaClientKnownRequestError",
      code: "ECONNREFUSED",
    });
    expect(isDatabaseUnavailable(err)).toBe(true);
  });

  it("detecta la caída con conexiones ya abiertas (P1017 y error sin código de `pg`)", () => {
    expect(isDatabaseUnavailable({ name: "PrismaClientKnownRequestError", code: "P1017" })).toBe(true);
    expect(isDatabaseUnavailable(new Error("Connection terminated unexpectedly"))).toBe(true);
  });

  it("detecta códigos de Prisma y errores envueltos en `cause`", () => {
    expect(isDatabaseUnavailable({ code: "P1001" })).toBe(true);
    expect(isDatabaseUnavailable(new Error("wrap", { cause: { code: "ETIMEDOUT" } }))).toBe(true);
  });

  it("ignora otros errores", () => {
    expect(isDatabaseUnavailable(new Error("otro"))).toBe(false);
    expect(isDatabaseUnavailable({ code: "P2002" })).toBe(false);
    expect(isDatabaseUnavailable(null)).toBe(false);
  });
});
