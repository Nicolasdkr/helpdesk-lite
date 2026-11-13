import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Página no encontrada</h1>
      <p className="mt-2 text-sm text-slate-500">La página que buscas no existe o se ha movido.</p>
      <Link to="/" className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-500">
        Volver al inicio
      </Link>
    </div>
  );
}
