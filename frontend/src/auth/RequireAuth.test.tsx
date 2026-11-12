import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppLayout } from "../components/layout/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { demoUser, loginAs, mockFetch, renderWithProviders } from "../test/utils";
import { RequireAuth } from "./RequireAuth";

const agent = { ...demoUser, id: "33333333-3333-4333-8333-333333333333", name: "Tomás Técnico", role: "AGENT" as const };

const routes = [
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <p>Inicio</p> },
          { path: "/tickets/abc", element: <p>Detalle del ticket abc</p> },
        ],
      },
    ],
  },
];

describe("RequireAuth: a dónde se vuelve tras iniciar sesión", () => {
  it("tras cerrar sesión a mano, el siguiente usuario entra en el inicio (no en la página del anterior)", async () => {
    loginAs(demoUser);
    mockFetch((url) =>
      url.pathname === "/api/auth/login" ? { body: { user: agent, token: "t2" } } : { body: { user: demoUser } },
    );
    renderWithProviders(routes, "/tickets/abc");
    await screen.findByText("Detalle del ticket abc");

    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await userEvent.click(await screen.findByRole("button", { name: "Técnico" }));
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Inicio")).toBeInTheDocument();
    expect(screen.queryByText("Detalle del ticket abc")).not.toBeInTheDocument();
  });

  it("si el token caduca, tras volver a entrar se regresa a la página donde estaba", async () => {
    loginAs(demoUser);
    let expired = true;
    mockFetch((url) => {
      if (url.pathname === "/api/auth/login") {
        expired = false;
        return { body: { user: demoUser, token: "nuevo" } };
      }
      return expired ? { status: 401, body: { error: { message: "Token inválido o expirado" } } } : { body: { user: demoUser } };
    });
    renderWithProviders(routes, "/tickets/abc");

    // La validación de /auth/me responde 401 → sesión cerrada por caducidad
    await userEvent.click(await screen.findByRole("button", { name: "Empleado" }));
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Detalle del ticket abc")).toBeInTheDocument();
  });
});
