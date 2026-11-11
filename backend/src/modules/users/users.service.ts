import { prisma } from "../../lib/prisma.js";
import { publicUserSelect } from "./user.select.js";

export function listUsers() {
  return prisma.user.findMany({ select: publicUserSelect, orderBy: { createdAt: "asc" } });
}
