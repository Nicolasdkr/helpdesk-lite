/**
 * Campos públicos de un usuario. Se usa en todos los `select` de Prisma
 * para garantizar que `passwordHash` nunca salga en una respuesta.
 */
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;
