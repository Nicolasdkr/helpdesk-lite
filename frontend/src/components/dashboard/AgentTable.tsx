import { formatDuration } from "../../lib/format";
import { ROLE_LABELS } from "../../lib/labels";
import type { Metrics } from "../../types/api";
import { Avatar } from "../ui/Feedback";

/** Carga por técnico: varias medidas por fila → una tabla (no un gráfico por columna). */
export function AgentTable({ agents }: { agents: Metrics["agents"] }) {
  const sorted = [...agents].sort((a, b) => b.active - a.active || b.resolved - a.resolved);

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Carga por técnico</caption>
        <thead className="text-xs text-slate-500">
          <tr className="border-b border-slate-100">
            <th scope="col" className="px-5 pb-2 font-medium">
              Técnico
            </th>
            <th scope="col" className="px-3 pb-2 text-right font-medium">
              Activos
            </th>
            <th scope="col" className="px-3 pb-2 text-right font-medium">
              Resueltos
            </th>
            <th scope="col" className="px-5 pb-2 text-right font-medium">
              Tiempo medio
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50">
              <th scope="row" className="px-5 py-2.5 font-normal">
                <span className="flex items-center gap-2">
                  <Avatar name={a.name} size="sm" />
                  <span>
                    <span className="block font-medium text-slate-900">{a.name}</span>
                    <span className="block text-xs text-slate-500">{ROLE_LABELS[a.role]}</span>
                  </span>
                </span>
              </th>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-900">{a.active}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-900">{a.resolved}</td>
              <td className="px-5 py-2.5 text-right tabular-nums text-slate-600">{formatDuration(a.avgResolutionHours)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
