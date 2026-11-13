import type { ReactNode } from "react";
import { useAuth } from "../../auth/use-auth";
import { useAgents, useAssignTicket, useChangeStatus, useUpdateTicket } from "../../features/tickets/hooks";
import { formatDateTime } from "../../lib/format";
import {
  ALLOWED_TRANSITIONS,
  CATEGORIES,
  CATEGORY_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "../../lib/labels";
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from "../../types/api";
import { PriorityBadge, StatusBadge } from "../ui/Badges";
import { Avatar, ErrorMessage } from "../ui/Feedback";
import { Select } from "../ui/Field";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function Person({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Avatar name={name} size="sm" />
      {name}
    </span>
  );
}

/**
 * Panel lateral con los datos del ticket.
 * AGENT y ADMIN ven controles para cambiar estado, prioridad, categoría y técnico asignado;
 * un USER solo ve la información.
 */
export function TicketSidebar({ ticket }: { ticket: Ticket }) {
  const { isStaff } = useAuth();
  const changeStatus = useChangeStatus(ticket.id);
  const assign = useAssignTicket(ticket.id);
  const update = useUpdateTicket(ticket.id);
  const { data: agents } = useAgents(isStaff);

  const mutationError = changeStatus.error ?? assign.error ?? update.error;
  const busy = changeStatus.isPending || assign.isPending || update.isPending;
  const nextStatuses = ALLOWED_TRANSITIONS[ticket.status];

  return (
    <aside className="space-y-4">
      <section className="rounded-xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-200">
        <h2 className="sr-only">Detalles del ticket</h2>
        <dl className="divide-y divide-slate-100">
          <Row label="Estado">
            {isStaff && nextStatuses.length > 0 ? (
              <Select
                aria-label="Cambiar estado"
                value={ticket.status}
                disabled={busy}
                onChange={(e) => changeStatus.mutate(e.target.value as TicketStatus)}
                className="w-36 py-1.5"
              >
                {[ticket.status, ...nextStatuses].map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            ) : (
              <StatusBadge status={ticket.status} />
            )}
          </Row>

          <Row label="Prioridad">
            {isStaff ? (
              <Select
                aria-label="Cambiar prioridad"
                value={ticket.priority}
                disabled={busy}
                onChange={(e) => update.mutate({ priority: e.target.value as TicketPriority })}
                className="w-36 py-1.5"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
            ) : (
              <PriorityBadge priority={ticket.priority} />
            )}
          </Row>

          <Row label="Categoría">
            {isStaff ? (
              <Select
                aria-label="Cambiar categoría"
                value={ticket.category}
                disabled={busy}
                onChange={(e) => update.mutate({ category: e.target.value as TicketCategory })}
                className="w-36 py-1.5"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            ) : (
              CATEGORY_LABELS[ticket.category]
            )}
          </Row>

          <Row label="Asignado a">
            {isStaff ? (
              <Select
                aria-label="Asignar técnico"
                value={ticket.assignedToId ?? ""}
                disabled={busy || !agents}
                onChange={(e) => assign.mutate(e.target.value || null)}
                className="w-36 py-1.5"
              >
                <option value="">Sin asignar</option>
                {agents?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            ) : ticket.assignedTo ? (
              <Person name={ticket.assignedTo.name} />
            ) : (
              <span className="italic text-slate-400">Sin asignar</span>
            )}
          </Row>

          <Row label="Creado por">
            <Person name={ticket.createdBy.name} />
          </Row>
          <Row label="Creado">{formatDateTime(ticket.createdAt)}</Row>
          <Row label="Última actividad">{formatDateTime(ticket.updatedAt)}</Row>
          {ticket.resolvedAt && <Row label="Resuelto">{formatDateTime(ticket.resolvedAt)}</Row>}
        </dl>
      </section>

      {mutationError && <ErrorMessage error={mutationError} />}
    </aside>
  );
}
