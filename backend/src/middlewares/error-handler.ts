import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";
import { isDatabaseUnavailable } from "../lib/db-errors.js";
import { HttpError } from "../lib/http-error.js";

/** Responde 404 para cualquier ruta que no exista. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(HttpError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

/** Errores que lanza `express.json()` (body-parser): traen su propio status HTTP. */
interface BodyParserError {
  type: string;
  status: number;
  expose: boolean;
  message: string;
}

function isBodyParserError(err: unknown): err is BodyParserError {
  return (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    "status" in err &&
    typeof err.status === "number" &&
    err.status >= 400 &&
    err.status < 500
  );
}

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

  if (isBodyParserError(err)) {
    const message =
      err.type === "entity.parse.failed"
        ? "El cuerpo de la petición no es un JSON válido"
        : err.expose
          ? err.message
          : "Solicitud inválida";
    res.status(err.status).json({ error: { message } });
    return;
  }

  if (isDatabaseUnavailable(err)) {
    console.error("⚠️  Base de datos no disponible. ¿Está corriendo? (docker compose up -d db)");
    res.status(503).json({ error: { message: "Base de datos no disponible, inténtalo más tarde" } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Error interno del servidor" } });
};
