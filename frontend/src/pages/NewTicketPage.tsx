import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { TicketForm } from "../components/tickets/TicketForm";
import { ErrorMessage } from "../components/ui/Feedback";
import { useCreateTicket } from "../features/tickets/hooks";

export function NewTicketPage() {
  const navigate = useNavigate();
  const createTicket = useCreateTicket();

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a los tickets
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Nuevo ticket</h1>
      <p className="mt-1 text-sm text-slate-500">
        Cuéntanos qué ocurre. El equipo de soporte revisará la prioridad y te responderá aquí.
      </p>

      <div className="mt-6 space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        {createTicket.isError && <ErrorMessage error={createTicket.error} />}
        <TicketForm
          submitLabel="Crear ticket"
          onCancel={() => void navigate("/")}
          onSubmit={async (values) => {
            const { ticket } = await createTicket.mutateAsync(values).catch(() => ({ ticket: null }));
            if (ticket) void navigate(`/tickets/${ticket.id}`);
          }}
        />
      </div>
    </div>
  );
}
