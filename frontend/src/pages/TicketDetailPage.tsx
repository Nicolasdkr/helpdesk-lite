import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "../auth/use-auth";
import { CommentThread } from "../components/tickets/CommentThread";
import { TicketForm } from "../components/tickets/TicketForm";
import { TicketSidebar } from "../components/tickets/TicketSidebar";
import { PriorityBadge, StatusBadge } from "../components/ui/Badges";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorMessage, Spinner } from "../components/ui/Feedback";
import { useDeleteTicket, useTicket, useUpdateTicket } from "../features/tickets/hooks";
import { ApiError } from "../lib/api";
import { CATEGORY_LABELS } from "../lib/labels";

export function TicketDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user, isStaff } = useAuth();
  const { data: ticket, isPending, isError, error } = useTicket(id);
  const update = useUpdateTicket(id);
  const deleteTicket = useDeleteTicket(id);
  const [editing, setEditing] = useState(false);

  if (isPending) return <Spinner label="Cargando ticket..." />;

  if (isError) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return notFound ? (
      <EmptyState
        title="Ticket no encontrado"
        description="Puede que no exista o que no tengas permiso para verlo."
        action={
          <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Volver a los tickets
          </Link>
        }
      />
    ) : (
      <ErrorMessage error={error} />
    );
  }

  // Mismas reglas que el backend: el creador edita mientras está OPEN; soporte siempre.
  const canEdit = isStaff || (ticket.createdById === user?.id && ticket.status === "OPEN");
  const canDelete = user?.role === "ADMIN";

  const handleDelete = () => {
    if (!confirm("¿Eliminar este ticket y todos sus comentarios? Esta acción no se puede deshacer.")) return;
    deleteTicket.mutate(undefined, { onSuccess: () => void navigate("/", { replace: true }) });
  };

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a los tickets
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            {editing ? (
              <>
                <h1 className="mb-5 text-lg font-semibold text-slate-900">Editar ticket</h1>
                {update.isError && (
                  <div className="mb-4">
                    <ErrorMessage error={update.error} />
                  </div>
                )}
                <TicketForm
                  defaultValues={ticket}
                  showClassification={false}
                  submitLabel="Guardar cambios"
                  onCancel={() => setEditing(false)}
                  onSubmit={(values) =>
                    update.mutateAsync(values).then(
                      () => setEditing(false),
                      () => undefined,
                    )
                  }
                />
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <span className="text-xs text-slate-500">· {CATEGORY_LABELS[ticket.category]}</span>
                  <span className="ml-auto font-mono text-xs text-slate-400" title={ticket.id}>
                    #{ticket.id.slice(0, 8)}
                  </span>
                </div>

                <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{ticket.title}</h1>
                <p className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-slate-700">
                  {ticket.description}
                </p>

                {(canEdit || canDelete) && (
                  <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {canEdit && (
                      <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                        <Pencil className="size-4" aria-hidden />
                        Editar
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="danger" size="sm" loading={deleteTicket.isPending} onClick={handleDelete}>
                        <Trash2 className="size-4" aria-hidden />
                        Eliminar
                      </Button>
                    )}
                  </div>
                )}
                {deleteTicket.isError && (
                  <div className="mt-4">
                    <ErrorMessage error={deleteTicket.error} />
                  </div>
                )}
              </>
            )}
          </article>

          <CommentThread ticket={ticket} />
        </div>

        <TicketSidebar ticket={ticket} />
      </div>
    </div>
  );
}
