/**
 * Cliente HTTP mínimo sobre `fetch`.
 * - Añade el JWT en la cabecera Authorization.
 * - Convierte las respuestas de error de la API en `ApiError`.
 * - Avisa (vía `onUnauthorized`) cuando el token caduca para cerrar la sesión.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly details?: Record<string, string[] | undefined>;

  constructor(status: number, message: string, details?: Record<string, string[] | undefined>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const onUnauthorized = (handler: () => void) => {
  unauthorizedHandler = handler;
};

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return `/api${path}${qs ? `?${qs}` : ""}`;
}

export async function api<T>(path: string, { method = "GET", body, query }: RequestOptions = {}) {
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. ¿Está la API en marcha?");
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Token caducado o inválido en una petición autenticada → cerrar sesión.
    if (res.status === 401 && authToken) unauthorizedHandler?.();
    throw new ApiError(
      res.status,
      data?.error?.message ?? `Error ${res.status}`,
      data?.error?.details,
    );
  }

  return data as T;
}
