import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { app, createUserAndLogin, resetDb } from "./helpers.js";

type Session = Awaited<ReturnType<typeof createUserAndLogin>>;

const validTicket = {
  title: "La impresora no imprime",
  description: "La impresora de la planta 2 muestra error de papel atascado.",
};

let user: Session;
let otherUser: Session;
let agent: Session;
let admin: Session;

beforeEach(async () => {
  await resetDb();
  [user, otherUser, agent, admin] = await Promise.all([
    createUserAndLogin("USER"),
    createUserAndLogin("USER"),
    createUserAndLogin("AGENT"),
    createUserAndLogin("ADMIN"),
  ]);
});
afterAll(() => prisma.$disconnect());

/** Crea un ticket vía API con la sesión indicada y devuelve su id. */
async function createTicket(session: Session, data: Partial<typeof validTicket> & object = {}) {
  const res = await request(app)
    .post("/api/tickets")
    .set(session.auth)
    .send({ ...validTicket, ...data });
  return res.body.ticket.id as string;
}

/** Fuerza un estado directamente en BD (para preparar escenarios). */
const setStatus = (id: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") =>
  prisma.ticket.update({ where: { id }, data: { status } });

describe("POST /api/tickets", () => {
  it("crea un ticket OPEN con el usuario autenticado como creador", async () => {
    const res = await request(app).post("/api/tickets").set(user.auth).send(validTicket);

    expect(res.status).toBe(201);
    expect(res.body.ticket).toMatchObject({
      title: validTicket.title,
      status: "OPEN",
      priority: "MEDIUM",
      category: "OTHER",
      createdBy: { id: user.id },
      assignedTo: null,
    });
  });

  it("responde 400 con datos inválidos", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set(user.auth)
      .send({ title: "x", description: "corta", priority: "ALTISIMA" });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details)).toEqual(
      expect.arrayContaining(["title", "description", "priority"]),
    );
  });

  it("responde 401 sin token", async () => {
    const res = await request(app).post("/api/tickets").send(validTicket);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/tickets", () => {
  beforeEach(async () => {
    await createTicket(user, { title: "VPN no conecta desde casa" });
    await createTicket(user, { title: "Pantalla parpadea" });
    const urgent = await createTicket(otherUser, { title: "Servidor de correo caído" });
    await prisma.ticket.update({ where: { id: urgent }, data: { priority: "URGENT" } });
  });

  it("un USER solo ve sus propios tickets", async () => {
    const res = await request(app).get("/api/tickets").set(user.auth);

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    for (const t of res.body.data) expect(t.createdBy.id).toBe(user.id);
  });

  it("un AGENT ve todos los tickets", async () => {
    const res = await request(app).get("/api/tickets").set(agent.auth);
    expect(res.body.meta.total).toBe(3);
  });

  it("filtra por prioridad y por texto", async () => {
    const byPriority = await request(app).get("/api/tickets?priority=URGENT").set(agent.auth);
    const bySearch = await request(app).get("/api/tickets?search=vpn").set(agent.auth);

    expect(byPriority.body.data.map((t: { title: string }) => t.title)).toEqual([
      "Servidor de correo caído",
    ]);
    expect(bySearch.body.data).toHaveLength(1);
    expect(bySearch.body.data[0].title).toBe("VPN no conecta desde casa");
  });

  it("filtra por estado", async () => {
    const res = await request(app).get("/api/tickets?status=CLOSED").set(agent.auth);
    expect(res.body.meta.total).toBe(0);
  });

  it("pagina los resultados", async () => {
    const res = await request(app).get("/api/tickets?page=2&pageSize=2").set(agent.auth);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
  });

  it("responde 400 con parámetros de consulta inválidos", async () => {
    const res = await request(app).get("/api/tickets?pageSize=500").set(agent.auth);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/tickets/:id", () => {
  it("el creador ve el detalle de su ticket", async () => {
    const id = await createTicket(user);
    const res = await request(app).get(`/api/tickets/${id}`).set(user.auth);

    expect(res.status).toBe(200);
    expect(res.body.ticket.id).toBe(id);
  });

  it("responde 404 (no 403) a un USER que pide un ticket ajeno", async () => {
    const id = await createTicket(otherUser);
    const res = await request(app).get(`/api/tickets/${id}`).set(user.auth);

    expect(res.status).toBe(404);
  });

  it("responde 400 si el id no es un UUID", async () => {
    const res = await request(app).get("/api/tickets/123").set(user.auth);
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/tickets/:id", () => {
  it("el creador puede editar el texto mientras está OPEN", async () => {
    const id = await createTicket(user);
    const res = await request(app)
      .patch(`/api/tickets/${id}`)
      .set(user.auth)
      .send({ title: "La impresora sigue sin imprimir" });

    expect(res.status).toBe(200);
    expect(res.body.ticket.title).toBe("La impresora sigue sin imprimir");
  });

  it("el creador no puede editar un ticket que ya está en curso (409)", async () => {
    const id = await createTicket(user);
    await setStatus(id, "IN_PROGRESS");

    const res = await request(app)
      .patch(`/api/tickets/${id}`)
      .set(user.auth)
      .send({ title: "Cambio tardío del título" });

    expect(res.status).toBe(409);
  });

  it("un USER no puede cambiar la prioridad (403)", async () => {
    const id = await createTicket(user);
    const res = await request(app)
      .patch(`/api/tickets/${id}`)
      .set(user.auth)
      .send({ priority: "URGENT" });

    expect(res.status).toBe(403);
  });

  it("un AGENT puede cambiar prioridad y categoría", async () => {
    const id = await createTicket(user);
    const res = await request(app)
      .patch(`/api/tickets/${id}`)
      .set(agent.auth)
      .send({ priority: "HIGH", category: "HARDWARE" });

    expect(res.status).toBe(200);
    expect(res.body.ticket).toMatchObject({ priority: "HIGH", category: "HARDWARE" });
  });

  it("responde 400 si no se envía ningún campo", async () => {
    const id = await createTicket(user);
    const res = await request(app).patch(`/api/tickets/${id}`).set(user.auth).send({});
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/tickets/:id/status", () => {
  it("un USER no puede cambiar el estado (403)", async () => {
    const id = await createTicket(user);
    const res = await request(app)
      .patch(`/api/tickets/${id}/status`)
      .set(user.auth)
      .send({ status: "CLOSED" });

    expect(res.status).toBe(403);
  });

  it("al resolver se rellena resolvedAt y al reabrir se limpia", async () => {
    const id = await createTicket(user);

    const resolved = await request(app)
      .patch(`/api/tickets/${id}/status`)
      .set(agent.auth)
      .send({ status: "RESOLVED" });
    expect(resolved.status).toBe(200);
    expect(resolved.body.ticket.resolvedAt).not.toBeNull();

    const reopened = await request(app)
      .patch(`/api/tickets/${id}/status`)
      .set(agent.auth)
      .send({ status: "IN_PROGRESS" });
    expect(reopened.body.ticket.resolvedAt).toBeNull();
  });

  it("un ticket CLOSED no se puede reabrir (409)", async () => {
    const id = await createTicket(user);
    await setStatus(id, "CLOSED");

    const res = await request(app)
      .patch(`/api/tickets/${id}/status`)
      .set(admin.auth)
      .send({ status: "OPEN" });

    expect(res.status).toBe(409);
  });
});

describe("PATCH /api/tickets/:id/assign", () => {
  it("asigna el ticket a un AGENT y luego lo desasigna", async () => {
    const id = await createTicket(user);

    const assigned = await request(app)
      .patch(`/api/tickets/${id}/assign`)
      .set(admin.auth)
      .send({ assignedToId: agent.id });
    expect(assigned.status).toBe(200);
    expect(assigned.body.ticket.assignedTo.id).toBe(agent.id);

    const mine = await request(app).get("/api/tickets?assignedToId=me").set(agent.auth);
    expect(mine.body.meta.total).toBe(1);

    const unassigned = await request(app)
      .patch(`/api/tickets/${id}/assign`)
      .set(admin.auth)
      .send({ assignedToId: null });
    expect(unassigned.body.ticket.assignedTo).toBeNull();
  });

  it("no permite asignar a un USER (400)", async () => {
    const id = await createTicket(user);
    const res = await request(app)
      .patch(`/api/tickets/${id}/assign`)
      .set(agent.auth)
      .send({ assignedToId: otherUser.id });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/tickets/:id", () => {
  it("un ADMIN puede eliminar un ticket", async () => {
    const id = await createTicket(user);
    const res = await request(app).delete(`/api/tickets/${id}`).set(admin.auth);

    expect(res.status).toBe(204);
    expect(await prisma.ticket.findUnique({ where: { id } })).toBeNull();
  });

  it("un AGENT no puede eliminar tickets (403)", async () => {
    const id = await createTicket(user);
    const res = await request(app).delete(`/api/tickets/${id}`).set(agent.auth);

    expect(res.status).toBe(403);
  });
});

describe("GET /api/users/agents", () => {
  it("devuelve solo técnicos y administradores", async () => {
    const res = await request(app).get("/api/users/agents").set(agent.auth);

    expect(res.status).toBe(200);
    const roles = res.body.users.map((u: { role: string }) => u.role);
    expect(roles.sort()).toEqual(["ADMIN", "AGENT"]);
  });

  it("un USER no puede consultarla (403)", async () => {
    const res = await request(app).get("/api/users/agents").set(user.auth);
    expect(res.status).toBe(403);
  });
});
