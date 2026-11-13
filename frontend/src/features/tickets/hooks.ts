import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type {
  Paginated,
  Role,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "../../types/api";

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedToId?: string;
  search?: string;
  sort?: "createdAt" | "updatedAt" | "priority";
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface TicketInput {
  title: string;
  description: string;
  priority?: TicketPriority;
  category?: TicketCategory;
}

/** Claves de caché centralizadas: así invalidar es predecible. */
export const ticketKeys = {
  all: ["tickets"] as const,
  list: (filters: TicketFilters) => ["tickets", "list", filters] as const,
  detail: (id: string) => ["tickets", "detail", id] as const,
};

export function useTickets(filters: TicketFilters) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: () => api<Paginated<Ticket>>("/tickets", { query: { ...filters } }),
    placeholderData: keepPreviousData, // evita parpadeos al cambiar de página o filtro
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => api<{ ticket: Ticket }>(`/tickets/${id}`).then((r) => r.ticket),
  });
}

export function useAgents(enabled: boolean) {
  return useQuery({
    queryKey: ["users", "agents"],
    queryFn: () =>
      api<{ users: { id: string; name: string; email: string; role: Role }[] }>("/users/agents").then(
        (r) => r.users,
      ),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/** Tras modificar un ticket: actualiza su detalle en caché y refresca los listados. */
function useTicketMutation<TVars>(mutationFn: (vars: TVars) => Promise<{ ticket: Ticket }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: ({ ticket }) => {
      queryClient.setQueryData(ticketKeys.detail(ticket.id), ticket);
      void queryClient.invalidateQueries({ queryKey: ["tickets", "list"] });
    },
  });
}

export const useCreateTicket = () =>
  useTicketMutation((input: TicketInput) => api("/tickets", { method: "POST", body: input }));

export const useUpdateTicket = (id: string) =>
  useTicketMutation((input: Partial<TicketInput>) =>
    api(`/tickets/${id}`, { method: "PATCH", body: input }),
  );

export const useChangeStatus = (id: string) =>
  useTicketMutation((status: TicketStatus) =>
    api(`/tickets/${id}/status`, { method: "PATCH", body: { status } }),
  );

export const useAssignTicket = (id: string) =>
  useTicketMutation((assignedToId: string | null) =>
    api(`/tickets/${id}/assign`, { method: "PATCH", body: { assignedToId } }),
  );

export function useDeleteTicket(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>(`/tickets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ticketKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ["tickets", "list"] });
    },
  });
}
