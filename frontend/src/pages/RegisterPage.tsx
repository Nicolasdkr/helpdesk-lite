import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router";
import { z } from "zod";
import { useAuth } from "../auth/use-auth";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/Feedback";
import { Field, Input } from "../components/ui/Field";

// Mismas reglas que valida el backend (auth.schemas.ts).
const schema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z.email("Introduce un email válido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña no puede superar los 72 caracteres"),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { user, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<unknown>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await registerUser(values);
      void navigate("/", { replace: true });
    } catch (err) {
      setServerError(err);
    }
  };

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Reporta incidencias y sigue su estado">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError !== null && <ErrorMessage error={serverError} />}

        <Field label="Nombre" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" invalid={!!errors.name} {...register("name")} />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
        </Field>

        <Field label="Contraseña" htmlFor="password" error={errors.password?.message} hint="Mínimo 8 caracteres">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
