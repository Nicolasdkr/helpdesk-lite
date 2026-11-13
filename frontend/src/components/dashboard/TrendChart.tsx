import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatLongDay, formatShortDay } from "../../lib/format";

export interface TrendSeries<K extends string> {
  key: K;
  label: string;
  color: string;
}

type Row<K extends string> = { date: string } & Record<K, number>;

const PLOT_H = 200;
const PAD = { top: 12, right: 12, bottom: 28, left: 32 }; // bottom = banda del eje X (incluida en la altura)
const HEIGHT = PLOT_H + PAD.top + PAD.bottom;

/** Máximo "redondo" del eje Y y su paso (1, 2, 5 × 10^n) para ~4 marcas. */
function niceScale(max: number) {
  if (max <= 4) return { max: 4, step: 1 };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  return { max: Math.ceil(max / step) * step, step };
}

/** Ancho real del contenedor, para que el SVG se adapte (móvil / escritorio). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    // Sin ResizeObserver (navegadores antiguos, jsdom en los tests) se usa el ancho por defecto.
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry!.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

/**
 * Gráfico de líneas (varias series, un único eje Y).
 * - Líneas de 2px, marcador final de 8px con anillo de 2px del color de fondo.
 * - Rejilla y eje: líneas finas (1px) sólidas y recesivas.
 * - Leyenda siempre visible (≥ 2 series), con clave de línea.
 * - Crosshair que se ajusta al día más cercano + tooltip con todas las series.
 *   También con teclado: ← → recorren los días, Inicio/Fin saltan a los extremos.
 * - Vista de tabla equivalente (los valores nunca dependen solo del tooltip).
 */
export function TrendChart<K extends string>({
  data,
  series,
  label,
}: {
  data: Row<K>[];
  series: TrendSeries<K>[];
  label: string;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const innerW = width - PAD.left - PAD.right;
  const n = data.length;
  const dataMax = Math.max(0, ...data.flatMap((d) => series.map((s) => d[s.key])));
  const { max: yMax, step } = niceScale(dataMax);
  const ticks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step);

  const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const y = (v: number) => PAD.top + PLOT_H - (v / yMax) * PLOT_H;

  // Etiquetas del eje X: tantas como quepan (~1 cada 72px), siempre incluyendo el último día.
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 72))));
  const xLabels = data.map((_, i) => i).filter((i) => (n - 1 - i) % every === 0);

  const indexFromPointer = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left;
    return Math.min(n - 1, Math.max(0, Math.round(n <= 1 ? 0 : (px / box.width) * (n - 1))));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const current = active ?? n - 1;
    const next = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setActive(Math.min(n - 1, Math.max(0, next)));
  };

  const point = active !== null ? data[active] : undefined;
  const tooltipLeft = active !== null ? x(active) : 0;
  const flip = tooltipLeft > width / 2;

  return (
    <div>
      {/* Leyenda: claves de línea, texto en tinta de texto */}
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
            {s.label}
          </li>
        ))}
      </ul>

      <div
        ref={ref}
        className="relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        tabIndex={0}
        role="group"
        aria-label={`${label}. Usa las flechas izquierda y derecha para recorrer los días.`}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((a) => a ?? n - 1)}
        onBlur={() => setActive(null)}
      >
        <svg width={width} height={HEIGHT} className="block overflow-visible" aria-hidden>
          {/* Rejilla + marcas del eje Y */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 ? "var(--color-chart-axis)" : "var(--color-chart-grid)"}
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-chart-muted text-[11px] tabular-nums">
                {t}
              </text>
            </g>
          ))}

          {/* Eje X */}
          {xLabels.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor={i === n - 1 ? "end" : i === 0 ? "start" : "middle"}
              className="fill-chart-muted text-[11px]"
            >
              {formatShortDay(data[i]!.date)}
            </text>
          ))}

          {/* Crosshair */}
          {active !== null && (
            <line
              x1={x(active)}
              x2={x(active)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="var(--color-chart-axis)"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
          )}

          {/* Series */}
          {series.map((s) => (
            <path
              key={s.key}
              d={data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[s.key])}`).join("")}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* Marcadores: en el punto activo, o al final de cada serie */}
          {series.map((s) => {
            const i = active ?? n - 1;
            if (n === 0) return null;
            return (
              <circle key={s.key} cx={x(i)} cy={y(data[i]![s.key])} r={4} fill={s.color} stroke="#ffffff" strokeWidth={2} />
            );
          })}

          {/* Capa de captura del puntero: todo el área del gráfico es el objetivo */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={innerW}
            height={PLOT_H}
            fill="transparent"
            onPointerMove={(e) => setActive(indexFromPointer(e))}
            onPointerLeave={() => setActive(null)}
          />
        </svg>

        {/* Tooltip: el valor manda, el nombre de la serie acompaña */}
        <div aria-live="polite" className="sr-only">
          {point && `${formatLongDay(point.date)}: ${series.map((s) => `${s.label} ${point[s.key]}`).join(", ")}`}
        </div>
        {point && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-slate-200"
            style={flip ? { right: width - tooltipLeft + 10 } : { left: tooltipLeft + 10 }}
            aria-hidden
          >
            <p className="mb-1.5 font-medium text-slate-500 first-letter:uppercase">{formatLongDay(point.date)}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center gap-2 py-0.5">
                <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="font-semibold tabular-nums text-slate-900">{point[s.key]}</span>
                <span className="text-slate-500">{s.label}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Vista de tabla: equivalente accesible y para quien prefiera leer las cifras */}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer select-none text-xs font-medium text-indigo-600 hover:text-indigo-500">
          Ver como tabla
        </summary>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg ring-1 ring-slate-200">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">{label}</caption>
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Día
                </th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="px-3 py-2 text-right font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...data].reverse().map((d) => (
                <tr key={d.date}>
                  <th scope="row" className="px-3 py-1.5 font-normal text-slate-600">
                    {formatShortDay(d.date)}
                  </th>
                  {series.map((s) => (
                    <td key={s.key} className="px-3 py-1.5 text-right tabular-nums text-slate-900">
                      {d[s.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
