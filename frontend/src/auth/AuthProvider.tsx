import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, onUnauthorized, setAuthToken } from "../lib/api";
import type { AuthResponse, User } from "../types/api";
import { AuthContext, type AuthContextValue, type LogoutReason, type RegisterData } from "./auth-context";

const STORAGE_KEY = "helpdesk.session";

interface Session {
  user: User;
  token: string;
}

/**
 * Lee la sesión guardada. El token se registra en el cliente HTTP aquí mismo
 * (de forma síncrona) para que las primeras peticiones ya vayan autenticadas.
 */
function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const session = raw ? (JSON.parse(raw) as Session) : null;
    setAuthToken(session?.token ?? null);
    return session;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null) {
  setAuthToken(session?.token ?? null);
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Almacenamiento no disponible (modo privado): la sesión dura lo que la pestaña.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(loadSession);
  const [logoutReason, setLogoutReason] = useState<LogoutReason>(null);

  const startSession = useCallback((res: AuthResponse) => {
    const next = { user: res.user, token: res.token };
    saveSession(next);
    setSession(next);
    setLogoutReason(null);
  }, []);

  const endSession = useCallback(
    (reason: Exclude<LogoutReason, null>) => {
      saveSession(null);
      setSession(null);
      setLogoutReason(reason);
      queryClient.clear(); // no dejar datos del usuario anterior en caché
    },
    [queryClient],
  );

  // Si la API responde 401 (token caducado), se cierra la sesión.
  useEffect(() => onUnauthorized(() => endSession("expired")), [endSession]);

  // Al abrir la app con una sesión guardada, se valida el token y se refresca el usuario.
  const token = session?.token;
  useEffect(() => {
    if (!token) return;
    api<{ user: User }>("/auth/me")
      .then(({ user }) => startSession({ user, token }))
      .catch(() => {
        /* el 401 ya lo gestiona onUnauthorized */
      });
  }, [token, startSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isStaff: session?.user.role === "AGENT" || session?.user.role === "ADMIN",
      logoutReason,
      login: async (email, password) =>
        startSession(await api<AuthResponse>("/auth/login", { method: "POST", body: { email, password } })),
      register: async (data: RegisterData) =>
        startSession(await api<AuthResponse>("/auth/register", { method: "POST", body: data })),
      logout: () => endSession("manual"),
    }),
    [session, logoutReason, startSession, endSession],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
