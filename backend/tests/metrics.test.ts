import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { app, createUserAndLogin, resetDb } from "./helpers.js";

type Session = Awaited<ReturnType<typeof createUserAndLogin>>;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const today = () => new Date().toISOString().slice(0, 10);

let user: Session;
let agent: Session;

/** Crea un ticket directamente en BD con fechas controladas. */
function seedTicket(data: {
  createdAgo: number; // ms
  resolvedAfter?: number; // ms tras la creación
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category?: "HARDWARE" | "SOFTWARE" | "NETWORK" | "ACCESS" | "OTHER";
  assigned?: boolean;
}) {
  const createdAt = new Date(Date.now() - data.createdAgo);
  return prisma.ticket.create({
    data: {
      title: "Ticket de métricas",
      description: "Ticket creado para los tests de métricas.",
      status: data.status ?? "OPEN",
      priority: data.priority ?? "MEDIUM",
      category: data.category ?? "OTHER",
      createdAt,
      resolvedAt: data.resolvedAfter ? new Date(createdAt.getTime() + data.resolvedAfter) : null,
      createdById: user.id,
      assignedToId: data.assigned ? agent.id : null,
    },
  });
}

const getMetrics = (session: Session, days?: number) =>
  request(app)
    .get(`/api/metrics${days ? `?days=${days}` : ""}`)
    .set(session.auth);

beforeEach(async () => {
  await resetDb();
  [user, agent] = await Promise.all([createUserAndLogin("USER"), createUserAndLogin("AGENT")]);

  // Dentro de los últimos 7 días
  await seedTicket({ createdAgo: 1 * HOUR, priority: "URGENT", category: "NETWORK" }); // activo, sin asignar
  await seedTicket({ createdAgo: 2 * DAY, status: "IN_PROGRESS", priority: "HIGH", assigned: true, category: "NETWORK" });
  await seedTicket({ createdAgo: 3 * DAY, status: "RESOLVED", resolvedAfter: 4 * HOUR, assigned: true, category: "HARDWARE" });
  await seedTicket({ createdAgo: 4 * DAY, status: "CLOSED", resolvedAfter: 8 * HOUR, assigned: true, category: "SOFTWARE" });
  // Fuera de 7 días pero dentro de 30
  await seedTicket({ createdAgo: 20 * DAY, status: "CLOSED", resolvedAfter: 2 * DAY, assigned: true, category: "ACCESS" });
  // Fuera de 30 días pero dentro de 90
  await seedTicket({ createdAgo: 60 * DAY, priority: "LOW" }); // activo antiguo
});
afterAll(() => prisma.$disconnect());

describe("GET /api/metrics — permisos y validación", () => {
  it("un USER no tiene acceso (403)", async () => {
    expect((await getMetrics(user)).status).toBe(403);
  });

  it("sin token responde 401", async () => {
    expect((await request(app).get("/api/metrics")).status).toBe(401);
  });

  it("solo acepta periodos de 7, 30 o 90 días", async () => {
    const res = await getMetrics(agent, 15);
    expect(res.status).toBe(400);
  });

  it("por defecto usa 30 días", async () => {
    const res = await getMetrics(agent);
    expect(res.body.range.days).toBe(30);
  });
});

describe("GET /api/metrics — cálculos", () => {
  it("resumen de los últimos 7 días", async () => {
    const { body } = await getMetrics(agent, 7);

    expect(body.summary).toEqual({
      total: 4,
      active: 2,
      unassigned: 1,
      urgentActive: 1,
      resolved: 2,
      avgResolutionHours: 6, // (4 h + 8 h) / 2
    });
  });

  it("el periodo cambia qué tickets cuentan", async () => {
    const d30 = (await getMetrics(agent, 30)).body;
    const d90 = (await getMetrics(agent, 90)).body;

    expect(d30.summary.total).toBe(5);
    expect(d30.summary.resolved).toBe(3);
    expect(d30.summary.avgResolutionHours).toBe(20); // (4 + 8 + 48) / 3
    expect(d90.summary.total).toBe(6);
    expect(d90.summary.active).toBe(3);
  });

  it("devuelve todas las claves de las distribuciones, también las que valen 0", async () => {
    const { body } = await getMetrics(agent, 7);

    expect(body.byStatus).toEqual({ OPEN: 1, IN_PROGRESS: 1, RESOLVED: 1, CLOSED: 1 });
    // La prioridad cuenta solo tickets activos
    expect(body.byPriority).toEqual({ LOW: 0, MEDIUM: 0, HIGH: 1, URGENT: 1 });
    expect(body.byCategory).toEqual({ HARDWARE: 1, SOFTWARE: 1, NETWORK: 2, ACCESS: 0, OTHER: 0 });
  });

  it("la serie diaria tiene un punto por día, terminando hoy", async () => {
    const { body } = await getMetrics(agent, 7);

    expect(body.daily).toHaveLength(7);
    expect(body.daily.at(-1).date).toBe(today());
    const created = body.daily.reduce((s: number, d: { created: number }) => s + d.created, 0);
    expect(created).toBe(4);
  });

  it("carga por técnico: activos asignados, resueltos y tiempo medio", async () => {
    const { body } = await getMetrics(agent, 30);
    const me = body.agents.find((a: { id: string }) => a.id === agent.id);

    expect(me).toMatchObject({ active: 1, resolved: 3, avgResolutionHours: 20 });
    expect(body.agents.some((a: { id: string }) => a.id === user.id)).toBe(false);
  });
});
