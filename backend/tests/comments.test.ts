import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { app, createUserAndLogin, resetDb } from "./helpers.js";

type Session = Awaited<ReturnType<typeof createUserAndLogin>>;

let user: Session;
let otherUser: Session;
let agent: Session;
let admin: Session;
let ticketId: string;

const commentsUrl = () => `/api/tickets/${ticketId}/comments`;

/** Publica un comentario y devuelve la respuesta completa. */
const postComment = (session: Session, body: string, isInternal?: boolean) =>
  request(app).post(commentsUrl()).set(session.auth).send({ body, isInternal });

beforeEach(async () => {
  await resetDb();
  [user, otherUser, agent, admin] = await Promise.all([
    createUserAndLogin("USER"),
    createUserAndLogin("USER"),
    createUserAndLogin("AGENT"),
    createUserAndLogin("ADMIN"),
  ]);

  const res = await request(app).post("/api/tickets").set(user.auth).send({
    title: "El monitor no enciende",
    description: "El monitor de mi puesto no enciende desde esta mañana.",
  });
  ticketId = res.body.ticket.id;
});
afterAll(() => prisma.$disconnect());

describe("POST /api/tickets/:id/comments", () => {
  it("el creador del ticket puede comentar", async () => {
    const res = await postComment(user, "¿Hay alguna novedad?");

    expect(res.status).toBe(201);
    expect(res.body.comment).toMatchObject({
      body: "¿Hay alguna novedad?",
      isInternal: false,
      author: { id: user.id, role: "USER" },
    });
  });

  it("un AGENT puede escribir una nota interna", async () => {
    const res = await postComment(agent, "Probablemente sea la fuente de alimentación.", true);

    expect(res.status).toBe(201);
    expect(res.body.comment.isInternal).toBe(true);
  });

  it("un USER no puede escribir notas internas (403)", async () => {
    const res = await postComment(user, "Intento de nota interna", true);
    expect(res.status).toBe(403);
  });

  it("un USER no puede comentar en un ticket ajeno (404)", async () => {
    const res = await postComment(otherUser, "Hola");
    expect(res.status).toBe(404);
  });

  it("no se puede comentar en un ticket cerrado (409)", async () => {
    await prisma.ticket.update({ where: { id: ticketId }, data: { status: "CLOSED" } });
    const res = await postComment(agent, "Comentario tardío");

    expect(res.status).toBe(409);
  });

  it("responde 400 si el comentario está vacío", async () => {
    const res = await postComment(user, "   ");
    expect(res.status).toBe(400);
  });

  it("comentar actualiza la fecha de última actividad del ticket", async () => {
    const before = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    await postComment(agent, "Revisando el equipo");
    const after = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });

    expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
  });
});

describe("GET /api/tickets/:id/comments", () => {
  beforeEach(async () => {
    await postComment(user, "Primer mensaje del usuario");
    await postComment(agent, "Nota interna: pedir repuesto", true);
    await postComment(agent, "Vamos a cambiar el cable de alimentación");
  });

  it("el USER no ve las notas internas", async () => {
    const res = await request(app).get(commentsUrl()).set(user.auth);

    expect(res.status).toBe(200);
    expect(res.body.comments.map((c: { body: string }) => c.body)).toEqual([
      "Primer mensaje del usuario",
      "Vamos a cambiar el cable de alimentación",
    ]);
  });

  it("el AGENT ve todos los comentarios en orden cronológico", async () => {
    const res = await request(app).get(commentsUrl()).set(agent.auth);

    expect(res.body.comments).toHaveLength(3);
    expect(res.body.comments[1].isInternal).toBe(true);
  });

  it("un USER no puede leer los comentarios de un ticket ajeno (404)", async () => {
    const res = await request(app).get(commentsUrl()).set(otherUser.auth);
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/tickets/:id/comments/:commentId", () => {
  it("el autor puede borrar su comentario", async () => {
    const { body } = await postComment(user, "Mensaje equivocado");
    const res = await request(app).delete(`${commentsUrl()}/${body.comment.id}`).set(user.auth);

    expect(res.status).toBe(204);
  });

  it("otra persona no puede borrarlo (403), pero un ADMIN sí", async () => {
    const { body } = await postComment(user, "Mensaje del usuario");
    const url = `${commentsUrl()}/${body.comment.id}`;

    expect((await request(app).delete(url).set(agent.auth)).status).toBe(403);
    expect((await request(app).delete(url).set(admin.auth)).status).toBe(204);
  });

  it("un USER no puede ver ni borrar una nota interna (404)", async () => {
    const { body } = await postComment(agent, "Nota interna", true);
    const res = await request(app).delete(`${commentsUrl()}/${body.comment.id}`).set(user.auth);

    expect(res.status).toBe(404);
  });
});

describe("Borrado en cascada", () => {
  it("al eliminar un ticket se eliminan sus comentarios", async () => {
    await postComment(user, "Comentario que desaparecerá");
    await request(app).delete(`/api/tickets/${ticketId}`).set(admin.auth);

    expect(await prisma.comment.count({ where: { ticketId } })).toBe(0);
  });
});
