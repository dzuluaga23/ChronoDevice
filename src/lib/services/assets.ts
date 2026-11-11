/**
 * Service de assets — reglas de negocio.
 * Valida que las referencias (categoría, marca, ubicación, proveedor)
 * pertenezcan a la MISMA empresa del activo (aislamiento multi-tenant).
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assets,
  brands,
  categories,
  locations,
  suppliers,
} from "@/lib/db/schema";
import { badRequest, notFound } from "@/lib/api/http";
import type { AuthContext } from "@/lib/auth/session";
import * as assetsRepo from "@/lib/repositories/assets";
import type {
  AssetQueryInput,
  CreateAssetInput,
  UpdateAssetInput,
} from "@/lib/validators/asset";

/** Referencias que deben pertenecer a la empresa del activo. */
const refTables = {
  categoryId: categories,
  brandId: brands,
  locationId: locations,
  supplierId: suppliers,
} as const;

type RefKey = keyof typeof refTables;

async function validateRefs(
  companyId: string,
  refs: Partial<Record<RefKey, string | null | undefined>>,
) {
  const refKeys: RefKey[] = [
    "categoryId",
    "brandId",
    "locationId",
    "supplierId",
  ];

  for (const key of refKeys) {
    const refId = refs[key];
    if (!refId) continue;

    const table = refTables[key];
    const [row] = await db
      .select({ id: table.id, companyId: table.companyId })
      .from(table)
      .where(eq(table.id, refId))
      .limit(1);

    if (!row || row.companyId !== companyId) {
      throw badRequest(
        `La referencia "${key}" no pertenece a tu empresa.`,
      );
    }
  }
}

export async function listAssets(companyId: string, query: AssetQueryInput) {
  return assetsRepo.listAssets(companyId, query);
}

export async function getAsset(ctx: AuthContext, assetId: string) {
  const asset = await assetsRepo.getAssetById(ctx.companyId, assetId);
  if (!asset) throw notFound("Activo no encontrado");
  return asset;
}

export async function createAsset(
  ctx: AuthContext,
  input: CreateAssetInput,
) {
  await validateRefs(ctx.companyId, input);
  const code = await assetsRepo.nextAssetCode(ctx.companyId);
  return assetsRepo.insertAsset({ ...input, companyId: ctx.companyId, code });
}

export async function updateAsset(
  ctx: AuthContext,
  assetId: string,
  input: UpdateAssetInput,
) {
  const existing = await assetsRepo.getAssetById(ctx.companyId, assetId);
  if (!existing) throw notFound("Activo no encontrado");

  await validateRefs(ctx.companyId, input);
  const updated = await assetsRepo.updateAsset(ctx.companyId, assetId, input);
  if (!updated) throw notFound("Activo no encontrado");
  return updated;
}

export async function deleteAsset(ctx: AuthContext, assetId: string) {
  const deleted = await assetsRepo.deleteAsset(ctx.companyId, assetId);
  if (!deleted) throw notFound("Activo no encontrado");
  return deleted;
}

/** Confirma la existencia de un activo dentro de la empresa. */
export async function assertAssetExists(
  companyId: string,
  assetId: string,
) {
  const [row] = await db
    .select({ id: assets.id })
    .from(assets)
    .where(eq(assets.id, assetId))
    .limit(1);
  if (!row || !(await assetsRepo.getAssetById(companyId, assetId))) {
    throw notFound("Activo no encontrado");
  }
}
