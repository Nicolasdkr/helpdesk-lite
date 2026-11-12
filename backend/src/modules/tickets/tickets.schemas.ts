import { z } from "zod";
import { TicketCategory, TicketPriority, TicketStatus } from "../../generated/prisma/enums.js";

const title = z.string().trim().min(5, "El título debe tener al menos 5 caracteres").max(150);
const description = z
  .string()
  .trim()
  .min(10, "La descripción debe tener al menos 10 caracteres")
  .max(5000);

export const createTicketSchema = z.object({
  title,
  description,
  priority: z.enum(TicketPriority).optional(),
  category: z.enum(TicketCategory).optional(),
});

export const updateTicketSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
    priority: z.enum(TicketPriority).optional(),
    category: z.enum(TicketCategory).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Debes enviar al menos un campo para actualizar",
  });

export const changeStatusSchema = z.object({
  status: z.enum(TicketStatus),
});

export const assignTicketSchema = z.object({
  // null = desasignar
  assignedToId: z.uuid("Id de usuario inválido").nullable(),
});

export const listTicketsQuerySchema = z.object({
  status: z.enum(TicketStatus).optional(),
  priority: z.enum(TicketPriority).optional(),
  category: z.enum(TicketCategory).optional(),
  // "me" = tickets asignados al usuario autenticado
  assignedToId: z.union([z.literal("me"), z.uuid()]).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["createdAt", "updatedAt", "priority"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const ticketIdParamSchema = z.object({
  id: z.uuid("Id de ticket inválido"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
