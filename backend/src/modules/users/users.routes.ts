import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import * as usersService from "./users.service.js";

export const usersRouter = Router();

usersRouter.use(authenticate);

/** Lista completa de usuarios: solo administradores. */
usersRouter.get("/", authorize("ADMIN"), async (_req, res) => {
  res.json({ users: await usersService.listUsers() });
});

/** Técnicos disponibles para asignar tickets (desplegable "Asignar a"). */
usersRouter.get("/agents", authorize("AGENT", "ADMIN"), async (_req, res) => {
  res.json({ users: await usersService.listAgents() });
});
