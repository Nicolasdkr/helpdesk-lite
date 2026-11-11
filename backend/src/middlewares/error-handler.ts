import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";
import { HttpError } from "../lib/http-error.js";

/** Responde 404 para cualquier ruta que no exista. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(HttpError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

/**
 * Middleware central de errores. Todas las respuestas de error
 * comparten el formato: { error: { message, details? } }
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: { message: "Datos de entrada inválidos", details: z.flattenError(err).fieldErrors },
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Error interno del servidor" } });
};
