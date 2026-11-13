import type { Prisma } from "../../generated/prisma/client.js";
import type { TicketCategory, TicketPriority, TicketStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE: TicketStatus[] = ["OPEN", "IN_PROGRESS"];

/** Rellena con 0 las claves que no aparecen en un groupBy (para que el frontend reciba siempre todas). */
function countsBy<K extends string>(keys: readonly K[], rows: { key: K; count: number }[]) {
  const result = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  for (const row of rows) result[row.key] = row.count;
  return result;
}

const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

/**
 * Métricas del panel para los últimos `days` días.
 *
 * Definiciones (las mismas que muestra la interfaz):
 * - Las distribuciones (estado, prioridad, categoría) y los totales cuentan los tickets
 *   CREADOS en el periodo.
 * - "Resueltos" y el tiempo medio de resolución cuentan los tickets RESUELTOS en el periodo
 *   (`resolvedAt` dentro del rango), aunque se crearan antes.
 * - La serie diaria agrupa por día (UTC) las creaciones y las resoluciones.
 */
export async function getMetrics(days: number) {
  const now = new Date();
  // Desde el inicio (UTC) del primer día del periodo, contando hoy.
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - (days - 1) * DAY_MS);

  const createdInRange: Prisma.TicketWhereInput = { createdAt: { gte: from } };
  const activeInRange: Prisma.TicketWhereInput = { ...createdInRange, status: { in: ACTIVE } };

  const [total, active, unassigned, urgentActive, byStatus, byPriority, byCategory, daily, resolution, agents] =
    await Promise.all([
      prisma.ticket.count({ where: createdInRange }),
      prisma.ticket.count({ where: activeInRange }),
      prisma.ticket.count({ where: { ...activeInRange, assignedToId: null } }),
      prisma.ticket.count({ where: { ...activeInRange, priority: "URGENT" } }),
      prisma.ticket.groupBy({ by: ["status"], where: createdInRange, _count: { _all: true } }),
      prisma.ticket.groupBy({ by: ["priority"], where: activeInRange, _count: { _all: true } }),
      prisma.ticket.groupBy({ by: ["category"], where: createdInRange, _count: { _all: true } }),

      // Serie diaria: generate_series crea un día por fila, aunque ese día no haya tickets.
      prisma.$queryRaw<{ date: string; created: number; resolved: number }[]>`
        WITH days AS (
          SELECT generate_series(${from}::timestamp, date_trunc('day', timezone('utc', now())), interval '1 day') AS day
        )
        SELECT
          to_char(days.day, 'YYYY-MM-DD') AS date,
          (SELECT count(*)::int FROM tickets t WHERE date_trunc('day', t."createdAt") = days.day) AS created,
          (SELECT count(*)::int FROM tickets t WHERE date_trunc('day', t."resolvedAt") = days.day) AS resolved
        FROM days
        ORDER BY days.day`,

      // Tiempo de resolución por técnico (NULL = sin asignar) en una sola consulta.
      prisma.$queryRaw<{ assignedToId: string | null; resolved: number; avgHours: number | null }[]>`
        SELECT
          "assignedToId",
          count(*)::int AS resolved,
          (avg(extract(epoch FROM ("resolvedAt" - "createdAt"))) / 3600)::float AS "avgHours"
        FROM tickets
        WHERE "resolvedAt" >= ${from}::timestamp
        GROUP BY "assignedToId"`,

      prisma.user.findMany({
        where: { role: { in: ["AGENT", "ADMIN"] } },
        select: {
          id: true,
          name: true,
          role: true,
          _count: { select: { ticketsAssigned: { where: { status: { in: ACTIVE } } } } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

  // Media global ponderada a partir de las medias por técnico.
  const resolvedTotal = resolution.reduce((sum, r) => sum + r.resolved, 0);
  const weightedHours = resolution.reduce((sum, r) => sum + (r.avgHours ?? 0) * r.resolved, 0);
  const byAgent = new Map(resolution.map((r) => [r.assignedToId, r]));

  return {
    range: { days, from: from.toISOString(), to: now.toISOString() },
    summary: {
      total,
      active,
      unassigned,
      urgentActive,
      resolved: resolvedTotal,
      avgResolutionHours: resolvedTotal ? round1(weightedHours / resolvedTotal) : null,
    },
    byStatus: countsBy<TicketStatus>(
      ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      byStatus.map((r) => ({ key: r.status, count: r._count._all })),
    ),
    byPriority: countsBy<TicketPriority>(
      ["LOW", "MEDIUM", "HIGH", "URGENT"],
      byPriority.map((r) => ({ key: r.priority, count: r._count._all })),
    ),
    byCategory: countsBy<TicketCategory>(
      ["HARDWARE", "SOFTWARE", "NETWORK", "ACCESS", "OTHER"],
      byCategory.map((r) => ({ key: r.category, count: r._count._all })),
    ),
    daily,
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      active: a._count.ticketsAssigned,
      resolved: byAgent.get(a.id)?.resolved ?? 0,
      avgResolutionHours: round1(byAgent.get(a.id)?.avgHours ?? null),
    })),
  };
}
