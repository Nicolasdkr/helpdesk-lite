import { Ticket } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold text-slate-900 ${className}`}>
      <span className="rounded-lg bg-indigo-600 p-1.5 text-white">
        <Ticket className="size-4" aria-hidden />
      </span>
      Helpdesk Lite
    </span>
  );
}
