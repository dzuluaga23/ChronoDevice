/**
 * Repositorio de catálogos (categorías, marcas, ubicaciones, proveedores).
 *
 * Las cuatro tablas comparten la base `id / companyId / name / createdAt`;
 * el acceso es genérico. Las columnas extra de cada una (description,
 * address, datos de contacto del proveedor) entran por `values` sin tipado
 * estricto en la frontera del repositorio: los valores ya llegaron
 * validados por Zod.
 */
import { and, asc, count, eq, ilike } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  assets,
  brands,
  categories,
  locations,
  suppliers,
} from "@/lib/db/schema";

const catalogTables = { categories, brands, locations, suppliers } as const;

export type CatalogKind = keyof typeof catalogTables;

/** Columnas que comparten las cuatro tablas de catálogo. */
interface CatalogColumns {
  id: PgColumn;
  companyId: PgColumn;
  name: PgColumn;
  createdAt: PgColumn;
}

function tableFor(kind: CatalogKind) {
  return catalogTables[kind];
}

function columnsFor(kind: CatalogKind): CatalogColumns {
  const table = tableFor(kind);
  const cols = table as unknown as CatalogColumns;
  return cols;
}

export async function listCatalog(
  kind: CatalogKind,
  companyId: string,
  q?: string,
) {
  const table = tableFor(kind);
  const { companyId: companyIdCol, name: nameCol } = columnsFor(kind);

  const filters = [eq(companyIdCol, companyId)];
  if (q) filters.push(ilike(nameCol, `%${q}%`));

  return db
    .select()
    .from(table)
    .where(and(...filters))
    .orderBy(asc(nameCol));
}

export async function getCatalogRow(
  kind: CatalogKind,
  companyId: string,
  id: string,
) {
  const table = tableFor(kind);
  const { id: idCol, companyId: companyIdCol } = columnsFor(kind);

  const [row] = await db
    .select()
    .from(table)
    .where(and(eq(companyIdCol, companyId), eq(idCol, id)))
    .limit(1);
  return row ?? null;
}

export async function insertCatalogRow(
  kind: CatalogKind,
  values: Record<string, unknown>,
) {
  const table = tableFor(kind);
  // values ya viene validado por Zod; el cast evita el tipado dinámico
  // por entidad dentro de este archivo.
  const [row] = await db
    .insert(table)
    .values(values as never)
    .returning();
  return row;
}

export async function updateCatalogRow(
  kind: CatalogKind,
  companyId: string,
  id: string,
  values: Record<string, unknown>,
) {
  const table = tableFor(kind);
  const { id: idCol, companyId: companyIdCol } = columnsFor(kind);

  const [row] = await db
    .update(table)
    .set(values as never)
    .where(and(eq(companyIdCol, companyId), eq(idCol, id)))
    .returning();
  return row ?? null;
}

export async function deleteCatalogRow(
  kind: CatalogKind,
  companyId: string,
  id: string,
) {
  const table = tableFor(kind);
  const { id: idCol, companyId: companyIdCol } = columnsFor(kind);

  const [row] = await db
    .delete(table)
    .where(and(eq(companyIdCol, companyId), eq(idCol, id)))
    .returning({ id: idCol });
  return row ?? null;
}

/**
 * Nº de activos de la empresa que usan este elemento del catálogo.
 * Sirve para impedir borrar algo que está en uso (las FK son set null,
 * pero perder la referencia es silencioso y confuso para el usuario).
 */
export async function countAssetsUsing(
  kind: CatalogKind,
  companyId: string,
  id: string,
): Promise<number> {
  const refColumns = {
    categories: assets.categoryId,
    brands: assets.brandId,
    locations: assets.locationId,
    suppliers: assets.supplierId,
  } as const;

  const [row] = await db
    .select({ total: count() })
    .from(assets)
    .where(
      and(
        eq(assets.companyId, companyId),
        eq(refColumns[kind], id),
      ),
    );
  return row?.total ?? 0;
}
