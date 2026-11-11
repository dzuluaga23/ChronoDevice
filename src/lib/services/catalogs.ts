/**
 * Service de catálogos — reglas de negocio compartidas por las cuatro
 * entidades (categorías, marcas, ubicaciones, proveedores).
 */
import { badRequest, notFound } from "@/lib/api/http";
import type { AuthContext } from "@/lib/auth/session";
import * as catalogsRepo from "@/lib/repositories/catalogs";
import type { CatalogKind } from "@/lib/repositories/catalogs";

/**
 * Detecta violación de unique (código Postgres 23505). Drizzle envuelve
 * el error de pg en DrizzleQueryError: el `code` está en la cadena de
 * `cause`, no en el error superficial.
 */
function isUniqueViolation(err: unknown): boolean {
  let current: unknown = err;
  while (typeof current === "object" && current !== null) {
    const e = current as { code?: unknown; cause?: unknown };
    if (e.code === "23505") return true;
    current = e.cause;
  }
  return false;
}

export async function listCatalog(
  ctx: AuthContext,
  kind: CatalogKind,
  q?: string,
) {
  return catalogsRepo.listCatalog(kind, ctx.companyId, q);
}

export async function getCatalogRow(
  ctx: AuthContext,
  kind: CatalogKind,
  id: string,
) {
  const row = await catalogsRepo.getCatalogRow(kind, ctx.companyId, id);
  if (!row) throw notFound("No encontrado");
  return row;
}

export async function createCatalogRow(
  ctx: AuthContext,
  kind: CatalogKind,
  values: Record<string, unknown>,
) {
  try {
    return await catalogsRepo.insertCatalogRow(kind, {
      ...values,
      companyId: ctx.companyId,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw badRequest("Ya existe un elemento con ese nombre");
    }
    throw err;
  }
}

export async function updateCatalogRow(
  ctx: AuthContext,
  kind: CatalogKind,
  id: string,
  values: Record<string, unknown>,
) {
  const existing = await catalogsRepo.getCatalogRow(kind, ctx.companyId, id);
  if (!existing) throw notFound("No encontrado");

  try {
    const updated = await catalogsRepo.updateCatalogRow(
      kind,
      ctx.companyId,
      id,
      values,
    );
    if (!updated) throw notFound("No encontrado");
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw badRequest("Ya existe un elemento con ese nombre");
    }
    throw err;
  }
}

/**
 * Borra un elemento del catálogo. Si hay activos usándolo, se rechaza:
 * la FK haría set null en silencio y el usuario perdería la referencia.
 */
export async function deleteCatalogRow(
  ctx: AuthContext,
  kind: CatalogKind,
  id: string,
) {
  const existing = await catalogsRepo.getCatalogRow(kind, ctx.companyId, id);
  if (!existing) throw notFound("No encontrado");

  const inUse = await catalogsRepo.countAssetsUsing(kind, ctx.companyId, id);
  if (inUse > 0) {
    throw badRequest(
      `No se puede borrar: ${inUse} activo(s) lo están usando. Desasócialos primero.`,
    );
  }

  await catalogsRepo.deleteCatalogRow(kind, ctx.companyId, id);
}
