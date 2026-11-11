/**
 * Service del ciclo de vida — mantenimientos, reparaciones y garantías.
 * Cada operación valida primero que el activo pertenezca a la empresa
 * en sesión (aislamiento multi-tenant).
 */
import { badRequest, notFound } from "@/lib/api/http";
import type { AuthContext } from "@/lib/auth/session";
import * as assetsService from "@/lib/services/assets";
import * as lifecycleRepo from "@/lib/repositories/lifecycle";
import type {
  CreateMaintenanceInput,
  CreateRepairInput,
  CreateWarrantyInput,
  UpdateMaintenanceInput,
  UpdateRepairInput,
  UpdateWarrantyInput,
} from "@/lib/validators/lifecycle";

/* ── Mantenimientos ── */

export async function listMaintenances(
  ctx: AuthContext,
  assetId: string,
) {
  await assetsService.assertAssetExists(ctx.companyId, assetId);
  return lifecycleRepo.listMaintenancesByAsset(ctx.companyId, assetId);
}

export async function createMaintenance(
  ctx: AuthContext,
  assetId: string,
  input: CreateMaintenanceInput,
) {
  await assetsService.assertAssetExists(ctx.companyId, assetId);
  return lifecycleRepo.insertMaintenance({
    ...input,
    companyId: ctx.companyId,
    assetId,
  });
}

export async function updateMaintenance(
  ctx: AuthContext,
  id: string,
  input: UpdateMaintenanceInput,
) {
  const updated = await lifecycleRepo.updateMaintenanceRow(
    ctx.companyId,
    id,
    input,
  );
  if (!updated) throw notFound("Mantenimiento no encontrado");
  return updated;
}

export async function deleteMaintenance(ctx: AuthContext, id: string) {
  const deleted = await lifecycleRepo.deleteMaintenanceRow(ctx.companyId, id);
  if (!deleted) throw notFound("Mantenimiento no encontrado");
  return deleted;
}

/* ── Reparaciones ── */

export async function listRepairs(ctx: AuthContext, assetId: string) {
  await assetsService.assertAssetExists(ctx.companyId, assetId);
  return lifecycleRepo.listRepairsByAsset(ctx.companyId, assetId);
}

export async function createRepair(
  ctx: AuthContext,
  assetId: string,
  input: CreateRepairInput,
) {
  await assetsService.assertAssetExists(ctx.companyId, assetId);
  return lifecycleRepo.insertRepair({
    ...input,
    companyId: ctx.companyId,
    assetId,
  });
}

export async function updateRepair(
  ctx: AuthContext,
  id: string,
  input: UpdateRepairInput,
) {
  const updated = await lifecycleRepo.updateRepairRow(ctx.companyId, id, input);
  if (!updated) throw notFound("Reparación no encontrada");
  return updated;
}

export async function deleteRepair(ctx: AuthContext, id: string) {
  const deleted = await lifecycleRepo.deleteRepairRow(ctx.companyId, id);
  if (!deleted) throw notFound("Reparación no encontrada");
  return deleted;
}

/* ── Garantías ── */

export async function listWarranties(ctx: AuthContext, assetId: string) {
  await assetsService.assertAssetExists(ctx.companyId, assetId);
  return lifecycleRepo.listWarrantiesByAsset(ctx.companyId, assetId);
}

export async function createWarranty(
  ctx: AuthContext,
  assetId: string,
  input: CreateWarrantyInput,
) {
  await assetsService.assertAssetExists(ctx.companyId, assetId);
  return lifecycleRepo.insertWarranty({
    ...input,
    companyId: ctx.companyId,
    assetId,
  });
}

export async function updateWarranty(
  ctx: AuthContext,
  id: string,
  input: UpdateWarrantyInput,
) {
  if (input.startDate && input.endDate && input.endDate <= input.startDate) {
    throw badRequest(
      "La fecha de fin debe ser posterior a la de inicio",
    );
  }
  const updated = await lifecycleRepo.updateWarrantyRow(
    ctx.companyId,
    id,
    input,
  );
  if (!updated) throw notFound("Garantía no encontrada");
  return updated;
}

export async function deleteWarranty(ctx: AuthContext, id: string) {
  const deleted = await lifecycleRepo.deleteWarrantyRow(ctx.companyId, id);
  if (!deleted) throw notFound("Garantía no encontrada");
  return deleted;
}

/* ── Historial (timeline) y costos acumulados ── */

export async function getAssetHistory(ctx: AuthContext, assetId: string) {
  const asset = await assetsService.getAsset(ctx, assetId);
  const [timeline, costs] = await Promise.all([
    lifecycleRepo.listAssetTimeline(ctx.companyId, assetId),
    lifecycleRepo.assetCostSummary(ctx.companyId, assetId),
  ]);

  const purchase = asset.purchasePrice ? Number(asset.purchasePrice) : 0;
  const maintenance = Number(costs.maintenanceCost);
  const repair = Number(costs.repairCost);

  return {
    asset,
    timeline,
    costs: {
      purchase: purchase.toFixed(2),
      maintenance: costs.maintenanceCost,
      repair: costs.repairCost,
      total: (purchase + maintenance + repair).toFixed(2),
    },
  };
}
