/**
 * Errores HTTP tipados y envoltorio de route handlers.
 * Las routes solo: validar → llamar service → responder.
 */
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const unauthorized = (msg = "No autenticado") =>
  new HttpError(401, "unauthorized", msg);

export const forbidden = (msg = "Sin permisos") =>
  new HttpError(403, "forbidden", msg);

export const notFound = (msg = "No encontrado") =>
  new HttpError(404, "not_found", msg);

export const badRequest = (msg = "Solicitud inválida") =>
  new HttpError(400, "bad_request", msg);

export function jsonOk<T>(data: T, status = 200) {
  return Response.json({ data }, { status });
}

export function jsonList<T>(items: T[], total: number) {
  return Response.json({ data: items, meta: { total } });
}

/**
 * Envuelve un handler de route: convierte HttpError y ZodError
 * en respuestas JSON consistentes.
 */
export function handle<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json(
          { error: { code: err.code, message: err.message } },
          { status: err.status },
        );
      }
      if (err instanceof ZodError) {
        return Response.json(
          {
            error: {
              code: "validation_error",
              message: "Datos inválidos",
              issues: err.issues,
            },
          },
          { status: 400 },
        );
      }
      console.error("[api] error inesperado:", err);
      return Response.json(
        {
          error: { code: "internal_error", message: "Error interno del servidor" },
        },
        { status: 500 },
      );
    }
  };
}
