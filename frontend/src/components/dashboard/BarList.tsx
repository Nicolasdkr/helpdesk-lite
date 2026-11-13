/**
 * Barras horizontales de un solo tono (slot 1): comparar magnitudes entre categorías.
 * - Barra fina (12px), extremo de datos redondeado 4px y cuadrada en la línea base.
 * - El valor va en la punta, en tinta de texto (nunca del color de la serie).
 * - Un valor 0 no dibuja barra, pero muestra su cifra.
 */
export function BarList({ items, label }: { items: { key: string; label: string; value: number }[]; label: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul aria-label={label} className="space-y-1">
      {items.map((item) => (
        <li
          key={item.key}
          className="grid grid-cols-[6.5rem_1fr] items-center gap-3 rounded-md px-1 py-1.5 text-sm hover:bg-slate-50"
          aria-label={`${item.label}: ${item.value}`}
        >
          <span className="truncate text-slate-600">{item.label}</span>
          <div className="flex items-center gap-2">
            {item.value > 0 && (
              <div
                className="h-3 rounded-r-[4px] bg-series-1"
                style={{ width: `calc(${(item.value / max) * 100}% - 2.5rem)`, minWidth: 3 }}
                aria-hidden
              />
            )}
            <span className="text-sm font-medium tabular-nums text-slate-900">{item.value}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
