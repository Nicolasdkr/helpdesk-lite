import clsx from "clsx";
import { ArrowDown, ArrowRight, ArrowUp, Flame } from "lucide-react";
import { PRIORITY_LABELS, STATUS_LABELS } from "../../lib/labels";
import type { TicketPriority, TicketStatus } from "../../types/api";

const statusStyles: Record<TicketStatus, string> = {
  OPEN: "bg-sky-50 text-sky-700 ring-sky-600/20",
  IN_PROGRESS: "bg-amber-50 text-amber-800 ring-amber-600/20",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const statusDot: Record<TicketStatus, string> = {
  OPEN: "bg-sky-500",
  IN_PROGRESS: "bg-amber-500",
  RESOLVED: "bg-emerald-500",
  CLOSED: "bg-slate-400",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status],
      )}
    >
      <span className={clsx("size-1.5 rounded-full", statusDot[status])} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}

const priorityStyles: Record<TicketPriority, string> = {
  LOW: "text-slate-500",
  MEDIUM: "text-blue-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600 font-semibold",
};

const priorityIcons = { LOW: ArrowDown, MEDIUM: ArrowRight, HIGH: ArrowUp, URGENT: Flame };

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const Icon = priorityIcons[priority];
  return (
    <span className={clsx("inline-flex items-center gap-1 text-xs font-medium", priorityStyles[priority])}>
      <Icon className="size-3.5" aria-hidden />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
