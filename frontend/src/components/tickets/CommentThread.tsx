import clsx from "clsx";
import { Lock, Send, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../auth/use-auth";
import { useAddComment, useComments, useDeleteComment } from "../../features/comments/hooks";
import { formatDateTime, formatRelative } from "../../lib/format";
import { ROLE_LABELS } from "../../lib/labels";
import type { Ticket } from "../../types/api";
import { Button } from "../ui/Button";
import { Avatar, ErrorMessage, Spinner } from "../ui/Feedback";
import { Textarea } from "../ui/Field";

export function CommentThread({ ticket }: { ticket: Ticket }) {
  const { user, isStaff } = useAuth();
  const { data: comments, isPending, isError, error } = useComments(ticket.id);
  const addComment = useAddComment(ticket.id);
  const deleteComment = useDeleteComment(ticket.id);

  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const isClosed = ticket.status === "CLOSED";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addComment.mutate(
      { body: body.trim(), isInternal },
      {
        onSuccess: () => {
          setBody("");
          setIsInternal(false);
        },
      },
    );
  };

  return (
    <section aria-labelledby="comments-title" className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <h2 id="comments-title" className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">
        Conversación {comments && <span className="font-normal text-slate-500">({comments.length})</span>}
      </h2>

      <div className="px-5 py-4">
        {isPending ? (
          <Spinner label="Cargando comentarios..." />
        ) : isError ? (
          <ErrorMessage error={error} />
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Todavía no hay comentarios.</p>
        ) : (
          <ol className="space-y-4">
            {comments.map((comment) => {
              const canDelete = comment.authorId === user?.id || user?.role === "ADMIN";
              return (
                <li key={comment.id} className="flex gap-3">
                  <Avatar name={comment.author.name} />
                  <div
                    className={clsx(
                      "min-w-0 flex-1 rounded-lg px-3.5 py-2.5",
                      comment.isInternal ? "bg-amber-50 ring-1 ring-inset ring-amber-200" : "bg-slate-50",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span className="font-semibold text-slate-900">{comment.author.name}</span>
                      {comment.author.role !== "USER" && (
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-medium text-indigo-700">
                          {ROLE_LABELS[comment.author.role]}
                        </span>
                      )}
                      {comment.isInternal && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">
                          <Lock className="size-3" aria-hidden />
                          Nota interna
                        </span>
                      )}
                      <time dateTime={comment.createdAt} title={formatDateTime(comment.createdAt)} className="text-slate-500">
                        {formatRelative(comment.createdAt)}
                      </time>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("¿Borrar este comentario?")) deleteComment.mutate(comment.id);
                          }}
                          className="ml-auto rounded p-1 text-slate-400 hover:bg-white hover:text-red-600"
                          aria-label="Borrar comentario"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-line break-words text-sm text-slate-700">{comment.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        {isClosed ? (
          <p className="text-center text-sm text-slate-500">Este ticket está cerrado y ya no admite comentarios.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {addComment.isError && <ErrorMessage error={addComment.error} />}
            <Textarea
              aria-label="Escribe un comentario"
              rows={3}
              placeholder={isInternal ? "Nota visible solo para el equipo de soporte..." : "Escribe un comentario..."}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={isInternal ? "bg-amber-50/50" : undefined}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {isStaff ? (
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-600"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                  />
                  <Lock className="size-3.5 text-amber-600" aria-hidden />
                  Nota interna
                </label>
              ) : (
                <span />
              )}
              <Button type="submit" size="sm" loading={addComment.isPending} disabled={!body.trim()}>
                <Send className="size-4" aria-hidden />
                Enviar
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
