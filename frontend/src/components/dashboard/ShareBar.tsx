import { formatPercent } from "../../lib/format";

interface Part {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * Parte de un todo con sus cifras al lado: barra segmentada fina (8px, extremos redondeados,
 * 2px de separación en color de fondo) + una fila por parte con muestra de color, nombre,
 * cantidad y porcentaje. La muestra de cada fila hace de leyenda; las cifras van en texto,
 * así el color nunca es el único canal.
 */
export function ShareBar({ parts, label }: { parts: Part[]; label: string }) {
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  const visible = parts.filter((p) => p.value > 0); // una parte en 0 no dibuja nada

  const summary = parts.map((p) => `${p.label} ${p.value}`).join(", ");

  return (
    <div>
      <div role="img" aria-label={`${label}: ${summary}`} className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-white">
        {total === 0 ? (
          <div className="flex-1 rounded-full bg-slate-100" />
        ) : (
          visible.map((p) => (
            <div key={p.key} style={{ flexGrow: p.value, backgroundColor: p.color }} className="first:rounded-l-full last:rounded-r-full" />
          ))
        )}
      </div>

      <ul className="mt-4 divide-y divide-slate-100">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2.5 py-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: p.color }} aria-hidden />
            <span className="flex-1 text-slate-600">{p.label}</span>
            <span className="font-medium tabular-nums text-slate-900">{p.value}</span>
            <span className="w-10 text-right tabular-nums text-slate-500">{total ? formatPercent(p.value / total) : "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
