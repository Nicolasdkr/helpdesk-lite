import type { RequestHandler } from "express";
import type { Role } from "../generated/prisma/client.js";
import { HttpError } from "../lib/http-error.js";
import { verifyToken } from "../lib/jwt.js";

/**
 * Exige un JWT válido en la cabecera `Authorization: Bearer <token>`.
 * Si es correcto, guarda los datos del usuario en `req.user`.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw HttpError.unauthorized("Falta el token de acceso");
  }

  try {
    req.user = verifyToken(header.slice("Bearer ".length));
  } catch {
    throw HttpError.unauthorized("Token inválido o expirado");
  }
  next();
};

/**
 * Restringe una ruta a ciertos roles. Úsalo siempre después de `authenticate`.
 * Ejemplo: router.get("/", authenticate, authorize("ADMIN"), handler)
 */
export const authorize =
  (...allowed: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) throw HttpError.unauthorized();
    if (!allowed.includes(req.user.role)) throw HttpError.forbidden();
    next();
  };
