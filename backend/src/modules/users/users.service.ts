import { prisma } from "../../lib/prisma.js";
import { publicUserSelect } from "./user.select.js";

export function listUsers() {
  return prisma.user.findMany({ select: publicUserSelect, orderBy: { createdAt: "asc" } });
}

/** Usuarios a los que se puede asignar un ticket (técnicos y administradores). */
export function listAgents() {
  return prisma.user.findMany({
    where: { role: { in: ["AGENT", "ADMIN"] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}
