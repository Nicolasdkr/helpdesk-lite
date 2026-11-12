import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import * as tickets from "./tickets.controller.js";

export const ticketsRouter = Router();

// Todas las rutas de tickets requieren sesión.
ticketsRouter.use(authenticate);

ticketsRouter.get("/", tickets.list);
ticketsRouter.post("/", tickets.create);
ticketsRouter.get("/:id", tickets.getById);
ticketsRouter.patch("/:id", tickets.update);
ticketsRouter.patch("/:id/status", authorize("AGENT", "ADMIN"), tickets.changeStatus);
ticketsRouter.patch("/:id/assign", authorize("AGENT", "ADMIN"), tickets.assign);
ticketsRouter.delete("/:id", authorize("ADMIN"), tickets.remove);
