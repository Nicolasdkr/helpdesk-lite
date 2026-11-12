import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Paginated } from "../../types/api";
import { Button } from "../ui/Button";

export function Pagination({ meta, onPageChange }: { meta: Paginated<unknown>["meta"]; onPageChange: (page: number) => void }) {
  if (meta.totalPages <= 1) return null;

  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-5">
      <p className="text-sm text-slate-600">
        <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span> de{" "}
        <span className="font-medium">{meta.total}</span>
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
          <ChevronLeft className="size-4" aria-hidden />
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Siguiente
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
