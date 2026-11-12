import type { Request, Response } from "express";
import {
  assignTicketSchema,
  changeStatusSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  ticketIdParamSchema,
  updateTicketSchema,
} from "./tickets.schemas.js";
import * as ticketsService from "./tickets.service.js";

// Todas las rutas pasan antes por `authenticate`, así que `req.user` siempre existe.

export async function list(req: Request, res: Response) {
  const query = listTicketsQuerySchema.parse(req.query);
  res.json(await ticketsService.listTickets(req.user!, query));
}

export async function getById(req: Request, res: Response) {
  const { id } = ticketIdParamSchema.parse(req.params);
  res.json({ ticket: await ticketsService.getTicket(id, req.user!) });
}

export async function create(req: Request, res: Response) {
  const input = createTicketSchema.parse(req.body);
  res.status(201).json({ ticket: await ticketsService.createTicket(input, req.user!) });
}

export async function update(req: Request, res: Response) {
  const { id } = ticketIdParamSchema.parse(req.params);
  const input = updateTicketSchema.parse(req.body);
  res.json({ ticket: await ticketsService.updateTicket(id, input, req.user!) });
}

export async function changeStatus(req: Request, res: Response) {
  const { id } = ticketIdParamSchema.parse(req.params);
  const { status } = changeStatusSchema.parse(req.body);
  res.json({ ticket: await ticketsService.changeStatus(id, status, req.user!) });
}

export async function assign(req: Request, res: Response) {
  const { id } = ticketIdParamSchema.parse(req.params);
  const { assignedToId } = assignTicketSchema.parse(req.body);
  res.json({ ticket: await ticketsService.assignTicket(id, assignedToId, req.user!) });
}

export async function remove(req: Request, res: Response) {
  const { id } = ticketIdParamSchema.parse(req.params);
  await ticketsService.deleteTicket(id, req.user!);
  res.status(204).end();
}
