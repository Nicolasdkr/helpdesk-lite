import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { TicketFilters } from "../../features/tickets/hooks";
import { CATEGORIES, CATEGORY_LABELS, PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "../../lib/labels";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Field";

interface Props {
  filters: TicketFilters;
  isStaff: boolean;
  onChange: (changes: Partial<TicketFilters>) => void;
  onReset: () => void;
}

export function TicketFiltersBar({ filters, isStaff, onChange, onReset }: Props) {
  // La búsqueda se aplica 300 ms después de dejar de escribir (debounce),
  // para no lanzar una petición por cada tecla.
  const [search, setSearch] = useState(filters.search ?? "");

  // Si la búsqueda cambia desde fuera (botón "Limpiar", navegación atrás...), sincroniza el input.
  // Se ajusta durante el render en lugar de en un efecto, como recomienda React.
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search);
    setSearch(filters.search ?? "");
  }

  useEffect(() => {
    if (search === (filters.search ?? "")) return;
    const id = setTimeout(() => onChange({ search: search || undefined }), 300);
    return () => clearTimeout(id);
  }, [search, filters.search, onChange]);

  const hasFilters = Boolean(
    filters.search || filters.status || filters.priority || filters.category || filters.assignedToId,
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <Input
          type="search"
          aria-label="Buscar tickets"
          placeholder="Buscar por título o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Select
          aria-label="Filtrar por estado"
          value={filters.status ?? ""}
          onChange={(e) => onChange({ status: (e.target.value || undefined) as TicketFilters["status"] })}
          className="sm:w-auto"
        >
          <option value="">Estado: todos</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filtrar por prioridad"
          value={filters.priority ?? ""}
          onChange={(e) => onChange({ priority: (e.target.value || undefined) as TicketFilters["priority"] })}
          className="sm:w-auto"
        >
          <option value="">Prioridad: todas</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filtrar por categoría"
          value={filters.category ?? ""}
          onChange={(e) => onChange({ category: (e.target.value || undefined) as TicketFilters["category"] })}
          className="sm:w-auto"
        >
          <option value="">Categoría: todas</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Ordenar"
          value={`${filters.sort ?? "createdAt"}:${filters.order ?? "desc"}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split(":") as [TicketFilters["sort"], TicketFilters["order"]];
            onChange({ sort, order });
          }}
          className="sm:w-auto"
        >
          <option value="createdAt:desc">Más recientes</option>
          <option value="createdAt:asc">Más antiguos</option>
          <option value="updatedAt:desc">Última actividad</option>
          <option value="priority:desc">Prioridad: alta primero</option>
        </Select>

        {isStaff && (
          <label className="col-span-2 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 sm:col-span-1 sm:ml-1">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              checked={filters.assignedToId === "me"}
              onChange={(e) => onChange({ assignedToId: e.target.checked ? "me" : undefined })}
            />
            Asignados a mí
          </label>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="col-span-2 sm:col-span-1">
            <X className="size-4" aria-hidden />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
