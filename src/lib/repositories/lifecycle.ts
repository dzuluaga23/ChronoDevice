/**
 * Repositorio del ciclo de vida: mantenimientos, reparaciones y garantías.
 * Toda query filtra por companyId (regla multi-tenant).
 */
import {
  and,
  asc,
  desc,
  eq,
  isNotNull,
  sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { assets, maintenances, repairs, warranties } from "@/lib/db/schema";

/* ── Mantenimientos ── */

export async function listMaintenancesByAsset(companyId: string, assetId: string) {
  return db
    .select()
    .from(maintenances)
    .where(
      and(eq(maintenances.companyId, companyId), eq(maintenances.assetId, assetId)),
    )
    .orderBy(desc(maintenances.performedAt));
}

export async function insertMaintenance(
  values: typeof maintenances.$inferInsert,
) {
  const [row] = await db.insert(maintenances).values(values).returning();
  return row;
}

export async function getMaintenanceRow(companyId: string, id: string) {
  const [row] = await db
    .select()
    .from(maintenances)
    .where(and(eq(maintenances.companyId, companyId), eq(maintenances.id, id)))
    .limit(1);
  return row ?? null;
}

export async function updateMaintenanceRow(
  companyId: string,
  id: string,
  values: Partial<typeof maintenances.$inferInsert>,
) {
  const [row] = await db
    .update(maintenances)
    .set(values)
    .where(and(eq(maintenances.companyId, companyId), eq(maintenances.id, id)))
    .returning();
  return row ?? null;
}

export async function deleteMaintenanceRow(companyId: string, id: string) {
  const [row] = await db
    .delete(maintenances)
    .where(and(eq(maintenances.companyId, companyId), eq(maintenances.id, id)))
    .returning({ id: maintenances.id });
  return row ?? null;
}

/* ── Reparaciones ── */

export async function listRepairsByAsset(companyId: string, assetId: string) {
  return db
    .select()
    .from(repairs)
    .where(and(eq(repairs.companyId, companyId), eq(repairs.assetId, assetId)))
    .orderBy(desc(repairs.repairedAt));
}

export async function insertRepair(values: typeof repairs.$inferInsert) {
  const [row] = await db.insert(repairs).values(values).returning();
  return row;
}

export async function getRepairRow(companyId: string, id: string) {
  const [row] = await db
    .select()
    .from(repairs)
    .where(and(eq(repairs.companyId, companyId), eq(repairs.id, id)))
    .limit(1);
  return row ?? null;
}

export async function updateRepairRow(
  companyId: string,
  id: string,
  values: Partial<typeof repairs.$inferInsert>,
) {
  const [row] = await db
    .update(repairs)
    .set(values)
    .where(and(eq(repairs.companyId, companyId), eq(repairs.id, id)))
    .returning();
  return row ?? null;
}

export async function deleteRepairRow(companyId: string, id: string) {
  const [row] = await db
    .delete(repairs)
    .where(and(eq(repairs.companyId, companyId), eq(repairs.id, id)))
    .returning({ id: repairs.id });
  return row ?? null;
}

/* ── Garantías ── */

export async function listWarrantiesByAsset(companyId: string, assetId: string) {
  return db
    .select()
    .from(warranties)
    .where(
      and(eq(warranties.companyId, companyId), eq(warranties.assetId, assetId)),
    )
    .orderBy(desc(warranties.endDate));
}

export async function insertWarranty(values: typeof warranties.$inferInsert) {
  const [row] = await db.insert(warranties).values(values).returning();
  return row;
}

export async function getWarrantyRow(companyId: string, id: string) {
  const [row] = await db
    .select()
    .from(warranties)
    .where(and(eq(warranties.companyId, companyId), eq(warranties.id, id)))
    .limit(1);
  return row ?? null;
}

export async function updateWarrantyRow(
  companyId: string,
  id: string,
  values: Partial<typeof warranties.$inferInsert>,
) {
  const [row] = await db
    .update(warranties)
    .set(values)
    .where(and(eq(warranties.companyId, companyId), eq(warranties.id, id)))
    .returning();
  return row ?? null;
}

export async function deleteWarrantyRow(companyId: string, id: string) {
  const [row] = await db
    .delete(warranties)
    .where(and(eq(warranties.companyId, companyId), eq(warranties.id, id)))
    .returning({ id: warranties.id });
  return row ?? null;
}

/* ── Próximos mantenimientos (para la vista de agenda) ── */

/** Mantenimientos con fecha próxima programada, del más inmediato al más lejano. */
export async function listUpcomingMaintenances(companyId: string) {
  return db
    .select({
      id: maintenances.id,
      assetId: maintenances.assetId,
      assetCode: assets.code,
      assetName: assets.name,
      assetStatus: assets.status,
      type: maintenances.type,
      nextAt: maintenances.nextAt,
      technician: maintenances.technician,
    })
    .from(maintenances)
    .innerJoin(assets, eq(assets.id, maintenances.assetId))
    .where(
      and(
        eq(maintenances.companyId, companyId),
        isNotNull(maintenances.nextAt),
      ),
    )
    .orderBy(asc(maintenances.nextAt));
}

/* ── Historial y costos acumulados ── */
export interface TimelineEvent {
  kind: "maintenance" | "repair";
  id: string;
  date: Date;
  description: string;
  technician: string | null;
  cost: string | null;
}

export async function listAssetTimeline(
  companyId: string,
  assetId: string,
): Promise<TimelineEvent[]> {
  const [maintRows, repairRows] = await Promise.all([
    listMaintenancesByAsset(companyId, assetId),
    listRepairsByAsset(companyId, assetId),
  ]);

  const events: TimelineEvent[] = [
    ...maintRows.map((m) => ({
      kind: "maintenance" as const,
      id: m.id,
      date: m.performedAt,
      description: m.description,
      technician: m.technician,
      cost: m.cost,
    })),
    ...repairRows.map((r) => ({
      kind: "repair" as const,
      id: r.id,
      date: r.repairedAt,
      description: r.failureDescription,
      technician: r.technician,
      cost: r.cost,
    })),
  ];

  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Costos acumulados del activo: compra + mantenimientos + reparaciones. */
export async function assetCostSummary(companyId: string, assetId: string) {
  const [maintCost, repairCost] = await Promise.all([
    db
      .select({ total: sql<string | null>`coalesce(sum(${maintenances.cost}), 0)::text` })
      .from(maintenances)
      .where(
        and(
          eq(maintenances.companyId, companyId),
          eq(maintenances.assetId, assetId),
        ),
      ),
    db
      .select({ total: sql<string | null>`coalesce(sum(${repairs.cost}), 0)::text` })
      .from(repairs)
      .where(and(eq(repairs.companyId, companyId), eq(repairs.assetId, assetId))),
  ]);

  return {
    maintenanceCost: maintCost[0]?.total ?? "0.00",
    repairCost: repairCost[0]?.total ?? "0.00",
  };
}
