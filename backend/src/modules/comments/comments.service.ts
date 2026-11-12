import type { Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../lib/http-error.js";
import type { TokenPayload } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import { findVisibleTicket, isStaff } from "../tickets/tickets.service.js";
import type { CreateCommentInput } from "./comments.schemas.js";

const commentInclude = { author: { select: { id: true, name: true, role: true } } } as const;

/** Un USER nunca ve las notas internas del equipo de soporte. */
const commentVisibility = (user: TokenPayload): Prisma.CommentWhereInput =>
  isStaff(user) ? {} : { isInternal: false };

export async function listComments(ticketId: string, user: TokenPayload) {
  await findVisibleTicket(ticketId, user);

  return prisma.comment.findMany({
    where: { ticketId, ...commentVisibility(user) },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function addComment(ticketId: string, input: CreateCommentInput, user: TokenPayload) {
  const ticket = await findVisibleTicket(ticketId, user);

  if (input.isInternal && !isStaff(user)) {
    throw HttpError.forbidden("Solo el equipo de soporte puede escribir notas internas");
  }
  if (ticket.status === "CLOSED") {
    throw HttpError.conflict("No se puede comentar en un ticket cerrado");
  }

  // Comentar cuenta como actividad: actualiza `updatedAt` del ticket
  // para que ordenar por "última actividad" lo suba arriba.
  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: { ...input, ticketId, authorId: user.sub },
      include: commentInclude,
    }),
    prisma.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } }),
  ]);
  return comment;
}

export async function deleteComment(ticketId: string, commentId: string, user: TokenPayload) {
  await findVisibleTicket(ticketId, user);

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, ticketId, ...commentVisibility(user) },
  });
  if (!comment) throw HttpError.notFound("Comentario no encontrado");

  if (comment.authorId !== user.sub && user.role !== "ADMIN") {
    throw HttpError.forbidden("Solo el autor o un administrador pueden borrar este comentario");
  }

  await prisma.comment.delete({ where: { id: commentId } });
}
