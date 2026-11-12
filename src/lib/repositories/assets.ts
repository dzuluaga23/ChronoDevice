/**
 * Repositorio de assets — la ÚNICA capa que habla con Drizzle.
 * Regla multi-tenant: toda query filtra por companyId; un asset
 * jamás se le expone a otra empresa.
 */
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assets,
  brands,
  categories,
  companies,
  locations,
  suppliers,
} from "@/lib/db/schema";
import type {
  AssetQueryInput,
  CreateAssetInput,
  UpdateAssetInput,
} from "@/lib/validators/asset";

const assetListSelection = {
  id: assets.id,
  companyId: assets.companyId,
  code: assets.code,
  name: assets.name,
  model: assets.model,
  serialNumber: assets.serialNumber,
  status: assets.status,
  purchaseDate: assets.purchaseDate,
  purchasePrice: assets.purchasePrice,
  notes: assets.notes,
  categoryId: assets.categoryId,
  categoryName: categories.name,
  brandId: assets.brandId,
  brandName: brands.name,
  locationId: assets.locationId,
  locationName: locations.name,
  supplierId: assets.supplierId,
  supplierName: suppliers.name,
  createdAt: assets.createdAt,
  updatedAt: assets.updatedAt,
};

export type AssetListItem = {
  [K in keyof typeof assetListSelection]: unknown;
};

function buildFilters(companyId: string, query: AssetQueryInput) {
  const filters = [eq(assets.companyId, companyId)];

  if (query.q) {
    const pattern = `%${query.q}%`;
    filters.push(
      or(
        ilike(assets.name, pattern),
        ilike(assets.code, pattern),
        ilike(assets.serialNumber, pattern),
        ilike(assets.model, pattern),
      )!,
    );
  }
  if (query.status) filters.push(eq(assets.status, query.status));
  if (query.categoryId) filters.push(eq(assets.categoryId, query.categoryId));
  if (query.locationId) filters.push(eq(assets.locationId, query.locationId));

  return and(...filters);
}

export async function listAssets(companyId: string, query: AssetQueryInput) {
  const filters = buildFilters(companyId, query);

  const [items, [totals]] = await Promise.all([
    db
      .select(assetListSelection)
      .from(assets)
      .leftJoin(categories, eq(categories.id, assets.categoryId))
      .leftJoin(brands, eq(brands.id, assets.brandId))
      .leftJoin(locations, eq(locations.id, assets.locationId))
      .leftJoin(suppliers, eq(suppliers.id, assets.supplierId))
      .where(filters)
      .orderBy(asc(assets.code))
      .limit(query.limit)
      .offset(query.offset),
    db.select({ total: count() }).from(assets).where(filters),
  ]);

  return { items, total: totals?.total ?? 0 };
}

export async function getAssetById(companyId: string, assetId: string) {
  const [asset] = await db
    .select(assetListSelection)
    .from(assets)
    .leftJoin(categories, eq(categories.id, assets.categoryId))
    .leftJoin(brands, eq(brands.id, assets.brandId))
    .leftJoin(locations, eq(locations.id, assets.locationId))
    .leftJoin(suppliers, eq(suppliers.id, assets.supplierId))
    .where(and(eq(assets.companyId, companyId), eq(assets.id, assetId)))
    .limit(1);
  return asset ?? null;
}

/** Siguiente código disponible para la empresa (AST-0001, AST-0002, ...). */
export async function nextAssetCode(companyId: string): Promise<string> {
  const [row] = await db
    .select({
      maxCode: sql<string | null>`max(${assets.code})`,
    })
    .from(assets)
    .where(eq(assets.companyId, companyId));

  const next = row?.maxCode ? Number.parseInt(row.maxCode.slice(4), 10) + 1 : 1;
  return `AST-${String(next).padStart(4, "0")}`;
}

export async function insertAsset(
  values: CreateAssetInput & {
    companyId: string;
    code: string;
  },
) {
  const [asset] = await db.insert(assets).values(values).returning();
  return asset;
}

export async function updateAsset(
  companyId: string,
  assetId: string,
  values: UpdateAssetInput,
) {
  const [asset] = await db
    .update(assets)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(assets.companyId, companyId), eq(assets.id, assetId)))
    .returning();
  return asset ?? null;
}

export async function deleteAsset(companyId: string, assetId: string) {
  const [asset] = await db
    .delete(assets)
    .where(and(eq(assets.companyId, companyId), eq(assets.id, assetId)))
    .returning({ id: assets.id, code: assets.code });
  return asset ?? null;
}

/** Ordena por código descendente para estadísticas/recientes. */
export async function listRecentAssets(companyId: string, limit = 5) {
  return db
    .select(assetListSelection)
    .from(assets)
    .leftJoin(categories, eq(categories.id, assets.categoryId))
    .leftJoin(brands, eq(brands.id, assets.brandId))
    .leftJoin(locations, eq(locations.id, assets.locationId))
    .leftJoin(suppliers, eq(suppliers.id, assets.supplierId))
    .where(eq(assets.companyId, companyId))
    .orderBy(desc(assets.createdAt))
    .limit(limit);
}

/**
 * Ficha pública para el QR escaneado: consulta SIN companyId (a propósito,
 * es la vista sin login) y devuelve solo datos no sensibles — sin serial,
 * sin costos, sin notas.
 */
export async function getPublicAssetById(assetId: string) {
  const [row] = await db
    .select({
      id: assets.id,
      code: assets.code,
      name: assets.name,
      status: assets.status,
      model: assets.model,
      companyName: companies.name,
      categoryName: categories.name,
      brandName: brands.name,
      locationName: locations.name,
    })
    .from(assets)
    .innerJoin(companies, eq(companies.id, assets.companyId))
    .leftJoin(categories, eq(categories.id, assets.categoryId))
    .leftJoin(brands, eq(brands.id, assets.brandId))
    .leftJoin(locations, eq(locations.id, assets.locationId))
    .where(eq(assets.id, assetId))
    .limit(1);
  return row ?? null;
}
