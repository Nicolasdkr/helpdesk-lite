import { CircleCheck, Clock, Flame, Inbox, UserX } from "lucide-react";
import { Navigate, useSearchParams } from "react-router";
import { useAuth } from "../auth/use-auth";
import { AgentTable } from "../components/dashboard/AgentTable";
import { BarList } from "../components/dashboard/BarList";
import { ChartCard } from "../components/dashboard/ChartCard";
import { PeriodFilter } from "../components/dashboard/PeriodFilter";
import { ShareBar } from "../components/dashboard/ShareBar";
import { StatTile } from "../components/dashboard/StatTile";
import { TrendChart } from "../components/dashboard/TrendChart";
import { ErrorMessage, Spinner } from "../components/ui/Feedback";
import { useMetrics } from "../features/metrics/hooks";
import { formatDuration } from "../lib/format";
import { CATEGORIES, CATEGORY_LABELS, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "../lib/labels";
import type { MetricsPeriod } from "../types/api";

// Estados → slots categóricos en orden fijo (el color sigue a la entidad, nunca a su posición).
const STATUS_COLORS = {
  OPEN: "var(--color-series-1)",
  IN_PROGRESS: "var(--color-series-2)",
  RESOLVED: "var(--color-series-3)",
  CLOSED: "var(--color-series-4)",
} as const;

const TREND_SERIES = [
  { key: "created" as const, label: "Creados", color: "var(--color-series-1)" },
  { key: "resolved" as const, label: "Resueltos", color: "var(--color-series-2)" },
];

const PERIODS: MetricsPeriod[] = [7, 30, 90];

export function DashboardPage() {
  const { isStaff } = useAuth();
  const [params, setParams] = useSearchParams();
  const fromUrl = Number(params.get("days"));
  const days: MetricsPeriod = PERIODS.includes(fromUrl as MetricsPeriod) ? (fromUrl as MetricsPeriod) : 30;
  const { data, isPending, isError, error, isFetching } = useMetrics(days, isStaff);

  if (!isStaff) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Panel de soporte</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cómo evoluciona la carga de trabajo del equipo. Las cifras cuentan los tickets creados en el periodo
          elegido; los resueltos y el tiempo de resolución, los resueltos en ese periodo.
        </p>
      </div>

      {/* Filtros: una fila, encima de todo lo que afectan */}
      <PeriodFilter value={days} onChange={(d) => setParams({ days: String(d) })} />

      {isPending ? (
        <Spinner label="Calculando métricas..." />
      ) : isError ? (
        <ErrorMessage error={error} />
      ) : (
        // Al recargar se conserva el panel anterior atenuado: sin saltos ni parpadeos.
        <div className={`space-y-6 transition-opacity ${isFetching ? "opacity-60" : ""}`} aria-busy={isFetching}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <StatTile icon={Inbox} label="Activos" value={String(data.summary.active)} hint={`Abiertos o en curso, de ${data.summary.total} creados`} />
            <StatTile icon={UserX} label="Sin asignar" value={String(data.summary.unassigned)} hint="Activos sin técnico" />
            <StatTile icon={Flame} label="Urgentes" value={String(data.summary.urgentActive)} hint="Activos con prioridad urgente" />
            <StatTile icon={CircleCheck} label="Resueltos" value={String(data.summary.resolved)} hint={`En los últimos ${days} días`} />
            <StatTile
              icon={Clock}
              label="Tiempo de resolución"
              value={formatDuration(data.summary.avgResolutionHours)}
              hint="Media desde la apertura"
            />
          </div>

          <ChartCard
            title="Tickets creados y resueltos por día"
            description="Si la línea de creados se mantiene por encima de la de resueltos, la cola crece."
          >
            <TrendChart data={data.daily} series={TREND_SERIES} label="Tickets creados y resueltos por día" />
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Estado de los tickets" description={`Tickets creados en los últimos ${days} días.`}>
              <ShareBar
                label="Estado de los tickets"
                parts={STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s], value: data.byStatus[s], color: STATUS_COLORS[s] }))}
              />
            </ChartCard>

            <ChartCard title="Activos por prioridad" description="Abiertos o en curso, de urgente a baja.">
              <BarList
                label="Tickets activos por prioridad"
                items={(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => ({
                  key: p,
                  label: PRIORITY_LABELS[p],
                  value: data.byPriority[p],
                }))}
              />
            </ChartCard>

            <ChartCard title="Tickets por categoría" description={`Creados en los últimos ${days} días, de más a menos.`}>
              <BarList
                label="Tickets por categoría"
                items={CATEGORIES.map((c) => ({ key: c, label: CATEGORY_LABELS[c], value: data.byCategory[c] })).sort(
                  (a, b) => b.value - a.value,
                )}
              />
            </ChartCard>

            <ChartCard title="Carga por técnico" description={`Activos asignados ahora; resueltos en los últimos ${days} días.`}>
              <AgentTable agents={data.agents} />
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}
