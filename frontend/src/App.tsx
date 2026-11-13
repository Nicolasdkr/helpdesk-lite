import { createBrowserRouter, RouterProvider } from "react-router";
import { RequireAuth } from "./auth/RequireAuth";
import { AppLayout } from "./components/layout/AppLayout";
import { Spinner } from "./components/ui/Feedback";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";

// El login se carga con la app; el resto de páginas se descargan al visitarlas
// (code splitting), así la primera carga es más ligera.
const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/register",
    lazy: () => import("./pages/RegisterPage").then((m) => ({ Component: m.RegisterPage })),
  },
  {
    // Todo lo de aquí dentro requiere sesión
    element: <RequireAuth />,
    HydrateFallback: Spinner,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            lazy: () => import("./pages/TicketsPage").then((m) => ({ Component: m.TicketsPage })),
          },
          {
            path: "dashboard",
            lazy: () => import("./pages/DashboardPage").then((m) => ({ Component: m.DashboardPage })),
          },
          {
            path: "tickets/new",
            lazy: () => import("./pages/NewTicketPage").then((m) => ({ Component: m.NewTicketPage })),
          },
          {
            path: "tickets/:id",
            lazy: () => import("./pages/TicketDetailPage").then((m) => ({ Component: m.TicketDetailPage })),
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
