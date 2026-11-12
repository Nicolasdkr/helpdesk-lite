import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Comment } from "../../types/api";
import { ticketKeys } from "../tickets/hooks";

const commentKeys = {
  list: (ticketId: string) => ["tickets", "detail", ticketId, "comments"] as const,
};

export function useComments(ticketId: string) {
  return useQuery({
    queryKey: commentKeys.list(ticketId),
    queryFn: () =>
      api<{ comments: Comment[] }>(`/tickets/${ticketId}/comments`).then((r) => r.comments),
  });
}

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; isInternal: boolean }) =>
      api<{ comment: Comment }>(`/tickets/${ticketId}/comments`, { method: "POST", body: input }),
    onSuccess: () => {
      // Comentar actualiza la "última actividad" del ticket: refresca detalle y listados.
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ["tickets", "list"] });
    },
  });
}

export function useDeleteComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      api<void>(`/tickets/${ticketId}/comments/${commentId}`, { method: "DELETE" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: commentKeys.list(ticketId) }),
  });
}
