import { HttpError } from "../../lib/http-error.js";
import { signToken } from "../../lib/jwt.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { publicUserSelect } from "../users/user.select.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

/**
 * Registro público. Siempre crea usuarios con rol USER:
 * los roles AGENT y ADMIN solo los puede asignar un administrador.
 */
export async function register(input: RegisterInput) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw HttpError.conflict("Ya existe una cuenta con ese email");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    },
    select: publicUserSelect,
  });

  return { user, token: signToken({ sub: user.id, role: user.role }) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Mismo mensaje si el email no existe o la contraseña falla:
  // así no revelamos qué emails están registrados.
  const valid = user && (await verifyPassword(input.password, user.passwordHash));
  if (!user || !valid) throw HttpError.unauthorized("Email o contraseña incorrectos");

  const { passwordHash: _omit, updatedAt: _u, ...publicUser } = user;
  return { user: publicUser, token: signToken({ sub: user.id, role: user.role }) };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw HttpError.notFound("Usuario no encontrado");
  return user;
}
