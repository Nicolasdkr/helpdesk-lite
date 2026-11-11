import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import * as usersService from "./users.service.js";

export const usersRouter = Router();

// Todas las rutas de usuarios son solo para administradores.
usersRouter.use(authenticate, authorize("ADMIN"));

usersRouter.get("/", async (_req, res) => {
  res.json({ users: await usersService.listUsers() });
});
