import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "El comentario no puede estar vacío").max(2000),
  isInternal: z.boolean().default(false),
});

export const ticketParamSchema = z.object({
  id: z.uuid("Id de ticket inválido"),
});

export const commentParamSchema = ticketParamSchema.extend({
  commentId: z.uuid("Id de comentario inválido"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
