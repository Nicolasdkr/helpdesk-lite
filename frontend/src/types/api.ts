// Tipos que reflejan las respuestas de la API (backend/src/modules/*).

export type Role = "ADMIN" | "AGENT" | "USER";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketCategory = "HARDWARE" | "SOFTWARE" | "NETWORK" | "ACCESS" | "OTHER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  createdById: string;
  assignedToId: string | null;
  createdBy: UserSummary;
  assignedTo: UserSummary | null;
}

export interface Comment {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  ticketId: string;
  authorId: string;
  author: { id: string; name: string; role: Role };
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface AuthResponse {
  user: User;
  token: string;
}
