import type { Prisma } from "../../generated/prisma/client.js";
import type { TicketStatus } from "../../generated/prisma/enums.js";
import { HttpError } from "../../lib/http-error.js";
import type { TokenPayload } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateTicketInput, ListTicketsQuery, UpdateTicketInput } from "./tickets.schemas.js";

/** Datos mínimos del creador y del asignado que se incluyen en cada ticket. */
const userSummary = { select: { id: true, name: true, email: true } } as const;
const ticketInclude = { createdBy: userSummary, assignedTo: userSummary } as const;

/** Transiciones de estado permitidas. CLOSED es un estado final. */
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["OPEN", "RESOLVED", "CLOSED"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: [],
};

const isStaff = (user: TokenPayload) => user.role === "AGENT" || user.role === "ADMIN";

/** Un USER solo ve sus propios tickets; AGENT y ADMIN ven todos. */
const visibilityFilter = (user: TokenPayload): Prisma.TicketWhereInput =>
  isStaff(user) ? {} : { createdById: user.sub };

/**
 * Busca un ticket respetando la visibilidad del usuario.
 * Un ticket ajeno responde 404 (no 403) para no revelar que existe.
 */
async function findVisibleTicket(id: string, user: TokenPayload) {
  const ticket = await prisma.ticket.findFirst({
    where: { id, ...visibilityFilter(user) },
    include: ticketInclude,
  });
  if (!ticket) throw HttpError.notFound("Ticket no encontrado");
  return ticket;
}

export async function listTickets(user: TokenPayload, query: ListTicketsQuery) {
  const where: Prisma.TicketWhereInput = {
    ...visibilityFilter(user),
    status: query.status,
    priority: query.priority,
    category: query.category,
    assignedToId: query.assignedToId === "me" ? user.sub : query.assignedToId,
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: [{ [query.sort]: query.order }, { createdAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export function getTicket(id: string, user: TokenPayload) {
  return findVisibleTicket(id, user);
}

export function createTicket(input: CreateTicketInput, user: TokenPayload) {
  return prisma.ticket.create({
    data: { ...input, createdById: user.sub },
    include: ticketInclude,
  });
}

export async function updateTicket(id: string, input: UpdateTicketInput, user: TokenPayload) {
  const ticket = await findVisibleTicket(id, user);

  if (!isStaff(user)) {
    // El creador solo puede corregir el texto, y solo antes de que lo atiendan.
    if (input.priority !== undefined || input.category !== undefined) {
      throw HttpError.forbidden("Solo el equipo de soporte puede cambiar la prioridad o la categoría");
    }
    if (ticket.status !== "OPEN") {
      throw HttpError.conflict("Solo puedes editar tickets que siguen abiertos");
    }
  }

  return prisma.ticket.update({ where: { id }, data: input, include: ticketInclude });
}

export async function changeStatus(id: string, status: TicketStatus, user: TokenPayload) {
  const ticket = await findVisibleTicket(id, user);

  if (ticket.status === status) return ticket;
  if (!ALLOWED_TRANSITIONS[ticket.status].includes(status)) {
    throw HttpError.conflict(`No se puede pasar un ticket de ${ticket.status} a ${status}`);
  }

  return prisma.ticket.update({
    where: { id },
    data: {
      status,
      // Se marca al resolver y se limpia si se reabre.
      resolvedAt:
        status === "RESOLVED" ? new Date() : status === "CLOSED" ? ticket.resolvedAt : null,
    },
    include: ticketInclude,
  });
}

export async function assignTicket(id: string, assignedToId: string | null, user: TokenPayload) {
  await findVisibleTicket(id, user);

  if (assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!assignee || assignee.role === "USER") {
      throw HttpError.badRequest("Solo se puede asignar a un técnico (AGENT) o administrador");
    }
  }

  return prisma.ticket.update({ where: { id }, data: { assignedToId }, include: ticketInclude });
}

export async function deleteTicket(id: string, user: TokenPayload) {
  await findVisibleTicket(id, user);
  await prisma.ticket.delete({ where: { id } });
}
