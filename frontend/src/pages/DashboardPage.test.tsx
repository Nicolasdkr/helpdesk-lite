import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { demoUser, loginAs, mockFetch, renderWithProviders } from "../test/utils";
import type { Metrics } from "../types/api";
import { DashboardPage } from "./DashboardPage";

const agent = { ...demoUser, name: "Tomás Técnico", role: "AGENT" as const };

const metrics = (days: 7 | 30 | 90): Metrics => ({
  range: { days, from: "2026-11-07T00:00:00.000Z", to: "2026-11-13T12:00:00.000Z" },
  summary: { total: 14, active: 8, unassigned: 3, urgentActive: 2, resolved: 7, avgResolutionHours: 9.8 },
  byStatus: { OPEN: 4, IN_PROGRESS: 4, RESOLVED: 6, CLOSED: 0 },
  byPriority: { LOW: 1, MEDIUM: 4, HIGH: 1, URGENT: 2 },
  byCategory: { HARDWARE: 1, SOFTWARE: 5, NETWORK: 2, ACCESS: 6, OTHER: 0 },
  daily: Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.UTC(2026, 10, 13 - days + 1 + i)).toISOString().slice(0, 10),
    created: i % 3,
    resolved: i % 2,
  })),
  agents: [
    { id: "a1", name: "Sofía Soporte", role: "AGENT", active: 3, resolved: 2, avgResolutionHours: 6.9 },
    { id: "a2", name: "Tomás Técnico", role: "AGENT", active: 4, resolved: 5, avgResolutionHours: 50 },
  ],
});

const routes = [
  { path: "/", element: <p>Lista de tickets</p> },
  { path: "/dashboard", element: <DashboardPage /> },
];

function setup(initialPath = "/dashboard") {
  loginAs(agent);
  const fetchMock = mockFetch((url) => {
    if (url.pathname === "/api/metrics") return { body: metrics(Number(url.searchParams.get("days")) as 7 | 30 | 90) };
    return { body: { user: agent } };
  });
  return { fetchMock, ...renderWithProviders(routes, initialPath) };
}

describe("DashboardPage", () => {
  it("un USER es redirigido y no se piden las métricas", async () => {
    loginAs(demoUser);
    const fetchMock = mockFetch(() => ({ body: { user: demoUser } }));
    renderWithProviders(routes, "/dashboard");

    expect(await screen.findByText("Lista de tickets")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/metrics"))).toBe(false);
  });

  it("muestra los KPIs con el formato adecuado", async () => {
    setup();

    expect(await screen.findByText("9,8 h")).toBeInTheDocument();
    expect(screen.getByText("Abiertos o en curso, de 14 creados")).toBeInTheDocument();
  });

  it("ordena las categorías de más a menos y muestra cada valor", async () => {
    setup();

    const list = await screen.findByRole("list", { name: "Tickets por categoría" });
    const rows = within(list).getAllByRole("listitem").map((li) => li.getAttribute("aria-label"));
    expect(rows).toEqual(["Accesos: 6", "Software: 5", "Red: 2", "Hardware: 1", "Otros: 0"]);
  });

  it("la barra de estado tiene un nombre accesible con todas las cifras", async () => {
    setup();

    expect(
      await screen.findByRole("img", { name: "Estado de los tickets: Abierto 4, En curso 4, Resuelto 6, Cerrado 0" }),
    ).toBeInTheDocument();
  });

  it("carga por técnico ordenada por activos, con duraciones legibles", async () => {
    setup();

    const table = await screen.findByRole("table", { name: "Carga por técnico" });
    const rows = within(table).getAllByRole("row").slice(1); // sin la cabecera
    expect(rows[0]).toHaveTextContent("Tomás Técnico");
    expect(rows[0]).toHaveTextContent("2,1 días"); // 50 h
  });

  it("cambiar de periodo pide los datos de nuevo y actualiza la tabla de la serie", async () => {
    const { fetchMock } = setup("/dashboard?days=7");
    await screen.findByText("9,8 h");

    await userEvent.click(screen.getByText("Ver como tabla"));
    expect(within(screen.getByRole("table", { name: /creados y resueltos/ })).getAllByRole("row")).toHaveLength(1 + 7);

    await userEvent.click(screen.getByRole("radio", { name: "Últimos 90 días" }));

    await waitFor(() =>
      expect(within(screen.getByRole("table", { name: /creados y resueltos/ })).getAllByRole("row")).toHaveLength(1 + 90),
    );
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("days=90"))).toBe(true);
  });
});
