import { createContext } from "react";
import type { User } from "../types/api";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

/** Por qué no hay sesión: "manual" = el usuario pulsó "Cerrar sesión"; "expired" = token caducado. */
export type LogoutReason = "manual" | "expired" | null;

export interface AuthContextValue {
  user: User | null;
  isStaff: boolean;
  logoutReason: LogoutReason;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
