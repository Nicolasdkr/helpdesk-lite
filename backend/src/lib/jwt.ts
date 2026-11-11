import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Role } from "../generated/prisma/client.js";

/** Datos que viajan dentro del token. Solo lo imprescindible: nunca datos sensibles. */
export interface TokenPayload {
  sub: string; // id del usuario
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

/** Devuelve el payload si el token es válido; lanza un error si está alterado o expirado. */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || !decoded.sub || !decoded["role"]) {
    throw new Error("Token con formato inválido");
  }
  return { sub: decoded.sub, role: decoded["role"] as Role };
}
