import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import * as authService from "./auth.service.js";

// Express 5 captura automáticamente los errores de funciones async
// y los envía al middleware de errores: no hace falta try/catch.

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.json(result);
}

export async function me(req: Request, res: Response) {
  const user = await authService.getProfile(req.user!.sub);
  res.json({ user });
}
