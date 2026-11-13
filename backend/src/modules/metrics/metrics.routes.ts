import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { metricsQuerySchema } from "./metrics.schemas.js";
import { getMetrics } from "./metrics.service.js";

export const metricsRouter = Router();

// El panel de métricas es para el equipo de soporte.
metricsRouter.get("/", authenticate, authorize("AGENT", "ADMIN"), async (req, res) => {
  const { days } = metricsQuerySchema.parse(req.query);
  res.json(await getMetrics(days));
});
