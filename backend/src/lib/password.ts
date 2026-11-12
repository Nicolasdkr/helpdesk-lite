import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

// Coste del hash: 10 rondas es un buen equilibrio entre seguridad y rendimiento.
// En los tests se usa el mínimo (4) para que la suite sea rápida; la lógica es la misma.
const SALT_ROUNDS = env.NODE_ENV === "test" ? 4 : 10;

export const hashPassword = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
