import type { Request, Response } from "express";
import { commentParamSchema, createCommentSchema, ticketParamSchema } from "./comments.schemas.js";
import * as commentsService from "./comments.service.js";

export async function list(req: Request, res: Response) {
  const { id } = ticketParamSchema.parse(req.params);
  res.json({ comments: await commentsService.listComments(id, req.user!) });
}

export async function create(req: Request, res: Response) {
  const { id } = ticketParamSchema.parse(req.params);
  const input = createCommentSchema.parse(req.body);
  res.status(201).json({ comment: await commentsService.addComment(id, input, req.user!) });
}

export async function remove(req: Request, res: Response) {
  const { id, commentId } = commentParamSchema.parse(req.params);
  await commentsService.deleteComment(id, commentId, req.user!);
  res.status(204).end();
}
