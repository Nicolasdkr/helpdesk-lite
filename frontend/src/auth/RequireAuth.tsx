import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./use-auth";

/**
 * Protege las rutas hijas: sin sesión, redirige al login.
 * Recuerda la página a la que se quería ir (para volver tras iniciar sesión),
 * salvo si el usuario cerró sesión a propósito: el siguiente en entrar
 * no debe aparecer en la página del anterior.
 */
export function RequireAuth() {
  const { user, logoutReason } = useAuth();
  const location = useLocation();

  if (!user) {
    const state = logoutReason === "manual" ? null : { from: location.pathname };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}
