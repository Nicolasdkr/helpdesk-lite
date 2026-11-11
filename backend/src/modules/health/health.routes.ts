import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

export const healthRouter = Router();

/** Liveness: el proceso está vivo. No toca la base de datos. */
healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

/** Readiness: la API puede atender tráfico (la base de datos responde). */
healthRouter.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "up" });
  } catch {
    res.status(503).json({ status: "error", database: "down" });
  }
});
