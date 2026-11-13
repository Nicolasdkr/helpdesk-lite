import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Metrics, MetricsPeriod } from "../../types/api";

export function useMetrics(days: MetricsPeriod, enabled = true) {
  return useQuery({
    queryKey: ["metrics", days],
    queryFn: () => api<Metrics>("/metrics", { query: { days } }),
    enabled, // solo AGENT/ADMIN: a un USER la API le respondería 403
    // Al cambiar de periodo se mantiene el panel anterior (atenuado) hasta que llegan los datos.
    placeholderData: keepPreviousData,
  });
}
