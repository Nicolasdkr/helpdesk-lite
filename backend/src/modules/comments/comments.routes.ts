import { Router } from "express";
import * as comments from "./comments.controller.js";

// Se monta dentro de /api/tickets/:id/comments.
// `mergeParams` permite leer el `:id` del ticket definido en el router padre.
// La autenticación ya la aplica el router de tickets.
export const commentsRouter = Router({ mergeParams: true });

commentsRouter.get("/", comments.list);
commentsRouter.post("/", comments.create);
commentsRouter.delete("/:commentId", comments.remove);
