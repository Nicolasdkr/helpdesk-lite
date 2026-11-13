import clsx from "clsx";
import type { ReactNode } from "react";

/** Tarjeta contenedora de un gráfico: título, descripción y contenido. */
export function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    // min-w-0: dentro de un grid, la tarjeta puede encogerse por debajo del ancho de su contenido
    <section className={clsx("min-w-0 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200", className)}>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
