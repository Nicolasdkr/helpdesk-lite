import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RequireAuth } from "../auth/RequireAuth";
import { demoUser, loginAs, mockFetch, renderWithProviders } from "../test/utils";
import type { Ticket } from "../types/api";
import { TicketsPage } from "./TicketsPage";

const ticket: Ticket = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "No puedo conectarme a la VPN",
  description: "Tiempo de espera agotado al conectar.",
  status: "IN_PROGRESS",
  priority: "URGENT",
  category: "NETWORK",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  resolvedAt: null,
  createdById: demoUser.id,
  assignedToId: null,
  createdBy: { id: demoUser.id, name: demoUser.name, email: demoUser.email },
  assignedTo: null,
};

const page = (data: Ticket[]) => ({
  body: { data, meta: { page: 1, pageSize: 10, total: data.length, totalPages: 1 } },
});

const routes = [
  { path: "/login", element: <p>Pantalla de login</p> },
  { element: <RequireAuth />, children: [{ path: "/", element: <TicketsPage /> }] },
];

describe("TicketsPage", () => {
  it("sin sesión redirige al login", async () => {
    mockFetch(() => ({ status: 401 }));
    renderWithProviders(routes, "/");

    expect(await screen.findByText("Pantalla de login")).toBeInTheDocument();
  });

  it("muestra los tickets del usuario con su estado y prioridad", async () => {
    loginAs(demoUser);
    mockFetch((url) => (url.pathname === "/api/tickets" ? page([ticket]) : { body: { user: demoUser } }));
    renderWithProviders(routes, "/");

    expect(await screen.findByText("No puedo conectarme a la VPN")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mis tickets" })).toBeInTheDocument();

    // Dentro de la lista (los mismos textos aparecen también en los filtros)
    const list = within(screen.getByRole("list"));
    expect(list.getByText("En curso")).toBeInTheDocument();
    expect(list.getByText("Urgente")).toBeInTheDocument();
    expect(list.getByText("Sin asignar")).toBeInTheDocument();
  });

  it("al filtrar por estado envía el filtro a la API", async () => {
    loginAs(demoUser);
    const fetchMock = mockFetch((url) =>
      url.pathname === "/api/tickets" ? page([ticket]) : { body: { user: demoUser } },
    );
    renderWithProviders(routes, "/");
    await screen.findByText("No puedo conectarme a la VPN");

    await userEvent.selectOptions(screen.getByLabelText("Filtrar por estado"), "RESOLVED");

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes("status=RESOLVED"))).toBe(true),
    );
  });

  it("muestra un estado vacío si no hay tickets", async () => {
    loginAs(demoUser);
    mockFetch((url) => (url.pathname === "/api/tickets" ? page([]) : { body: { user: demoUser } }));
    renderWithProviders(routes, "/");

    expect(await screen.findByText("Todavía no hay tickets")).toBeInTheDocument();
  });
});
