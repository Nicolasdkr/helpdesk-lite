import { Ticket } from "lucide-react";

/** `compact`: en pantallas pequeñas muestra solo el icono (el nombre queda para lectores de pantalla). */
export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold text-slate-900 ${className}`}>
      <span className="rounded-lg bg-indigo-600 p-1.5 text-white">
        <Ticket className="size-4" aria-hidden />
      </span>
      <span className={compact ? "sr-only sm:not-sr-only" : undefined}>Helpdesk Lite</span>
    </span>
  );
}
