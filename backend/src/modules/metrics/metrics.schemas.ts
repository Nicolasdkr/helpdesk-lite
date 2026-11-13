import { z } from "zod";

/** Periodos disponibles en el panel: últimos 7, 30 o 90 días. */
export const metricsQuerySchema = z.object({
  days: z
    .enum(["7", "30", "90"], "El periodo debe ser 7, 30 o 90 días")
    .default("30")
    .transform(Number),
});

export type MetricsQuery = z.infer<typeof metricsQuerySchema>;
