import clsx from "clsx";
import type { MetricsPeriod } from "../../types/api";

const OPTIONS: { value: MetricsPeriod; label: string }[] = [
  { value: 7, label: "7 días" },
  { value: 30, label: "30 días" },
  { value: 90, label: "90 días" },
];

/** Selector de periodo: un grupo de radios con aspecto de control segmentado. */
export function PeriodFilter({ value, onChange }: { value: MetricsPeriod; onChange: (v: MetricsPeriod) => void }) {
  return (
    <fieldset>
      <legend className="sr-only">Periodo</legend>
      <div className="inline-flex rounded-lg bg-slate-100 p-1">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className={clsx(
              "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-600",
              value === o.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
            )}
          >
            <input
              type="radio"
              name="period"
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              aria-label={`Últimos ${o.label}`}
              className="sr-only"
            />
            {/* En móvil se ve solo "7 días"; el nombre accesible completo lo da aria-label */}
            <span className="hidden sm:inline">Últimos </span>
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
