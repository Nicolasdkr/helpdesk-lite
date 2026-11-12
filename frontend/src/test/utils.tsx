import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router";
import { vi } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import type { User } from "../types/api";

export const demoUser: User = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Elena Empleada",
  email: "user@helpdesk.dev",
  role: "USER",
  createdAt: "2026-11-01T10:00:00.000Z",
};

/** Simula una sesión iniciada guardando el usuario como lo hace AuthProvider. */
export function loginAs(user: User) {
  localStorage.setItem("helpdesk.session", JSON.stringify({ user, token: "fake-token" }));
}

type Handler = (url: URL, init: RequestInit) => { status?: number; body?: unknown };

/**
 * Sustituye `fetch` por un mock: cada petición pasa por `handler`,
 * que decide el status y el cuerpo JSON de la respuesta.
 */
export function mockFetch(handler: Handler) {
  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input), "http://localhost");
    const { status = 200, body } = handler(url, init);
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

/** Renderiza rutas con todos los providers de la app (React Query, Auth, Router en memoria). */
export function renderWithProviders(routes: RouteObject[], initialPath = "/") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });

  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>,
    ),
  };
}
