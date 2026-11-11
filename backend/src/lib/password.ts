import bcrypt from "bcryptjs";

// Coste del hash: 10 rondas es un buen equilibrio entre seguridad y rendimiento.
const SALT_ROUNDS = 10;

export const hashPassword = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
