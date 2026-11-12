import { Plus } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "../auth/use-auth";
import { Pagination } from "../components/tickets/Pagination";
import { TicketFiltersBar } from "../components/tickets/TicketFiltersBar";
import { TicketList } from "../components/tickets/TicketList";
import { EmptyState, ErrorMessage, Spinner } from "../components/ui/Feedback";
import { useTickets, type TicketFilters } from "../features/tickets/hooks";

const FILTER_KEYS = ["status", "priority", "category", "assignedToId", "search", "sort", "order"] as const;

/** Los filtros viven en la URL: se pueden compartir, recargar y usar con "atrás". */
function filtersFromParams(params: URLSearchParams): TicketFilters {
  const filters: Record<string, string | number> = { page: Number(params.get("page")) || 1, pageSize: 10 };
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value) filters[key] = value;
  }
  return filters as TicketFilters;
}

export function TicketsPage() {
  const { user, isStaff } = useAuth();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const { data, isPending, isError, error, isFetching } = useTickets(filters);

  const updateFilters = useCallback(
    (changes: Partial<TicketFilters>) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined || value === "") next.delete(key);
          else next.set(key, String(value));
        }
        if (!("page" in changes)) next.delete("page"); // cambiar un filtro vuelve a la página 1
        return next;
      });
    },
    [setParams],
  );

  const hasFilters = FILTER_KEYS.some((k) => k !== "sort" && k !== "order" && params.has(k));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {isStaff ? "Todos los tickets" : "Mis tickets"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isStaff
              ? "Incidencias reportadas por toda la organización."
              : `Hola, ${user?.name.split(" ")[0]}. Aquí puedes seguir tus incidencias.`}
          </p>
        </div>
        {data && (
          <p className="text-sm text-slate-500" aria-live="polite">
            {data.meta.total} {data.meta.total === 1 ? "ticket" : "tickets"}
          </p>
        )}
      </div>

      <TicketFiltersBar
        filters={filters}
        isStaff={isStaff}
        onChange={updateFilters}
        onReset={() => setParams(new URLSearchParams())}
      />

      <section
        aria-busy={isFetching}
        className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition-opacity ${
          isFetching && !isPending ? "opacity-70" : ""
        }`}
      >
        {isPending ? (
          <Spinner label="Cargando tickets..." />
        ) : isError ? (
          <div className="p-4">
            <ErrorMessage error={error} />
          </div>
        ) : data.data.length === 0 ? (
          hasFilters ? (
            <EmptyState title="Sin resultados" description="Ningún ticket coincide con los filtros aplicados." />
          ) : (
            <EmptyState
              title="Todavía no hay tickets"
              description="Cuando reportes una incidencia, aparecerá aquí para que sigas su estado."
              action={
                <Link
                  to="/tickets/new"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
                >
                  <Plus className="size-4" aria-hidden />
                  Crear el primer ticket
                </Link>
              }
            />
          )
        ) : (
          <>
            <TicketList tickets={data.data} />
            <Pagination meta={data.meta} onPageChange={(page) => updateFilters({ page })} />
          </>
        )}
      </section>
    </div>
  );
}
