import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { z } from "zod";
import { useAuth } from "../auth/use-auth";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/Feedback";
import { Field, Input } from "../components/ui/Field";
import { ROLE_LABELS } from "../lib/labels";
import type { Role } from "../types/api";

const schema = z.object({
  email: z.email("Introduce un email válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});
type FormValues = z.infer<typeof schema>;

/** Cuentas creadas por `npm run db:seed`: facilitan probar la app con cada rol. */
const DEMO_ACCOUNTS: { role: Role; email: string }[] = [
  { role: "USER", email: "user@helpdesk.dev" },
  { role: "AGENT", email: "agent@helpdesk.dev" },
  { role: "ADMIN", email: "admin@helpdesk.dev" },
];
const DEMO_PASSWORD = "Password123!";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<unknown>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const from = (location.state as { from?: string } | null)?.from ?? "/";
  if (user) return <Navigate to={from} replace />;

  const onSubmit = async ({ email, password }: FormValues) => {
    setServerError(null);
    try {
      await login(email, password);
      void navigate(from, { replace: true });
    } catch (err) {
      setServerError(err);
    }
  };

  const fillDemo = (email: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", DEMO_PASSWORD, { shouldValidate: true });
  };

  return (
    <AuthLayout title="Inicia sesión" subtitle="Gestiona las incidencias de TI de tu equipo">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError !== null && <ErrorMessage error={serverError} />}

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
        </Field>

        <Field label="Contraseña" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Entrar
        </Button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
          Cuentas de demostración
        </p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button key={account.role} variant="secondary" size="sm" onClick={() => fillDemo(account.email)}>
              {ROLE_LABELS[account.role]}
            </Button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          Regístrate
        </Link>
      </p>
    </AuthLayout>
  );
}
