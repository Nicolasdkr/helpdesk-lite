/**
 * Error de negocio con código HTTP asociado.
 * Lánzalo desde servicios/controladores y el middleware de errores
 * lo convertirá en una respuesta JSON consistente.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }

  static badRequest(message = "Solicitud inválida", details?: unknown) {
    return new HttpError(400, message, details);
  }
  static unauthorized(message = "No autenticado") {
    return new HttpError(401, message);
  }
  static forbidden(message = "No tienes permiso para esta acción") {
    return new HttpError(403, message);
  }
  static notFound(message = "Recurso no encontrado") {
    return new HttpError(404, message);
  }
  static conflict(message = "El recurso ya existe") {
    return new HttpError(409, message);
  }
}
