import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { TicketInput } from "../../features/tickets/hooks";
import { CATEGORIES, CATEGORY_LABELS, PRIORITIES, PRIORITY_LABELS } from "../../lib/labels";
import { Button } from "../ui/Button";
import { Field, Input, Select, Textarea } from "../ui/Field";

// Mismas reglas que valida el backend (tickets.schemas.ts).
const schema = z.object({
  title: z.string().trim().min(5, "El título debe tener al menos 5 caracteres").max(150, "Máximo 150 caracteres"),
  description: z
    .string()
    .trim()
    .min(10, "Describe el problema con al menos 10 caracteres")
    .max(5000, "Máximo 5000 caracteres"),
  priority: z.enum(PRIORITIES),
  category: z.enum(CATEGORIES),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<FormValues>;
  /** Si es false, solo se editan título y descripción (USER editando su ticket). */
  showClassification?: boolean;
  submitLabel: string;
  onSubmit: (values: TicketInput) => Promise<unknown>;
  onCancel?: () => void;
}

export function TicketForm({ defaultValues, showClassification = true, submitLabel, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "MEDIUM", category: "OTHER", ...defaultValues },
  });

  const submit = (values: FormValues) =>
    onSubmit(
      showClassification ? values : { title: values.title, description: values.description },
    );

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <Field label="Título" htmlFor="title" error={errors.title?.message}>
        <Input
          id="title"
          placeholder="Ej.: No puedo conectarme a la VPN"
          invalid={!!errors.title}
          {...register("title")}
        />
      </Field>

      <Field
        label="Descripción"
        htmlFor="description"
        error={errors.description?.message}
        hint="¿Qué ocurre, desde cuándo y qué has probado ya?"
      >
        <Textarea id="description" rows={6} invalid={!!errors.description} {...register("description")} />
      </Field>

      {showClassification && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Categoría" htmlFor="category">
            <Select id="category" {...register("category")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prioridad" htmlFor="priority">
            <Select id="priority" {...register("priority")}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
