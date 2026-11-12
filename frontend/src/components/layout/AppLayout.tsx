import clsx from "clsx";
import { LogOut, Plus } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";
import { useAuth } from "../../auth/use-auth";
import { ROLE_LABELS } from "../../lib/labels";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Feedback";
import { Logo } from "./Logo";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
    isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900",
  );

export function AppLayout() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="Inicio">
            <Logo />
          </Link>

          <nav className="hidden sm:block">
            <NavLink to="/" end className={navLinkClass}>
              Tickets
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              <Plus className="size-4" aria-hidden />
              <span className="hidden sm:inline">Nuevo ticket</span>
              <span className="sr-only sm:hidden">Nuevo ticket</span>
            </Link>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3">
              <Avatar name={user.name} />
              <div className="hidden leading-tight md:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
                <LogOut className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
