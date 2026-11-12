import type { Role, TicketCategory, TicketPriority, TicketStatus } from "../types/api";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En curso",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  HARDWARE: "Hardware",
  SOFTWARE: "Software",
  NETWORK: "Red",
  ACCESS: "Accesos",
  OTHER: "Otros",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  AGENT: "Técnico",
  USER: "Empleado",
};

/** Mismas transiciones que valida el backend (tickets.service.ts). */
export const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["OPEN", "RESOLVED", "CLOSED"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: [],
};

// Tuplas `as const`: sirven para iterar en los <select> y para `z.enum()` en los formularios.
export const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const satisfies readonly TicketStatus[];
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const satisfies readonly TicketPriority[];
export const CATEGORIES = [
  "HARDWARE",
  "SOFTWARE",
  "NETWORK",
  "ACCESS",
  "OTHER",
] as const satisfies readonly TicketCategory[];
