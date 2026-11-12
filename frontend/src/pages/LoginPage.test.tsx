import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { demoUser, mockFetch, renderWithProviders } from "../test/utils";
import { LoginPage } from "./LoginPage";

const routes = [
  { path: "/login", element: <LoginPage /> },
  { path: "/", element: <p>Página de tickets</p> },
];

describe("LoginPage", () => {
  it("valida los campos antes de llamar a la API", async () => {
    const fetchMock = mockFetch(() => ({ status: 500 }));
    renderWithProviders(routes, "/login");

    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Introduce un email válido")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("los botones de demo rellenan las credenciales", async () => {
    mockFetch(() => ({ status: 500 }));
    renderWithProviders(routes, "/login");

    await userEvent.click(screen.getByRole("button", { name: "Técnico" }));

    expect(screen.getByLabelText("Email")).toHaveValue("agent@helpdesk.dev");
    expect(screen.getByLabelText("Contraseña")).toHaveValue("Password123!");
  });

  it("muestra el mensaje de la API si las credenciales son incorrectas", async () => {
    mockFetch(() => ({ status: 401, body: { error: { message: "Email o contraseña incorrectos" } } }));
    renderWithProviders(routes, "/login");

    await userEvent.type(screen.getByLabelText("Email"), "user@helpdesk.dev");
    await userEvent.type(screen.getByLabelText("Contraseña"), "incorrecta");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email o contraseña incorrectos");
  });

  it("inicia sesión, guarda la sesión y redirige", async () => {
    const fetchMock = mockFetch((url) =>
      url.pathname === "/api/auth/login"
        ? { body: { user: demoUser, token: "jwt-de-prueba" } }
        : { body: { user: demoUser } },
    );
    renderWithProviders(routes, "/login");

    await userEvent.click(screen.getByRole("button", { name: "Empleado" }));
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Página de tickets")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("helpdesk.session")!).token).toBe("jwt-de-prueba");

    // Las peticiones siguientes llevan el token
    await waitFor(() => {
      const meCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/api/auth/me"));
      expect(new Headers(meCall?.[1]?.headers).get("Authorization")).toBe("Bearer jwt-de-prueba");
    });
  });
});
