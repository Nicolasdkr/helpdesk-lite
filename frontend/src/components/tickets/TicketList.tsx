import { Link } from "react-router";
import { formatRelative } from "../../lib/format";
import { CATEGORY_LABELS } from "../../lib/labels";
import type { Ticket } from "../../types/api";
import { PriorityBadge, StatusBadge } from "../ui/Badges";
import { Avatar } from "../ui/Feedback";

export function TicketList({ tickets }: { tickets: Ticket[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <Link
            to={`/tickets/${ticket.id}`}
            className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <PriorityBadge priority={ticket.priority} />
                <span className="text-xs text-slate-400" aria-hidden>
                  ·
                </span>
                <span className="text-xs text-slate-500">{CATEGORY_LABELS[ticket.category]}</span>
              </div>
              <p className="mt-1 truncate font-medium text-slate-900">{ticket.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Abierto por {ticket.createdBy.name} · {formatRelative(ticket.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-4 sm:w-64 sm:justify-end">
              {ticket.assignedTo ? (
                <span className="flex items-center gap-1.5 text-xs text-slate-600" title={`Asignado a ${ticket.assignedTo.name}`}>
                  <Avatar name={ticket.assignedTo.name} size="sm" />
                  <span className="truncate">{ticket.assignedTo.name}</span>
                </span>
              ) : (
                <span className="text-xs italic text-slate-400">Sin asignar</span>
              )}
              <StatusBadge status={ticket.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
