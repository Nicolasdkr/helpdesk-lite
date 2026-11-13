import type { LucideIcon } from "lucide-react";

/**
 * KPI: cuando el dato es un único número, el número es el gráfico.
 * Cifras proporcionales (sin tabular-nums) porque es un valor grande y aislado.
 */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-1.5 text-sm text-slate-500">
        <Icon className="size-4 text-slate-400" aria-hidden />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
