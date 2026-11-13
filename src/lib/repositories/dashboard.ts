/**
 * Repositorio del dashboard: solo agregaciones (counts, sums, group by).
 * Toda query filtra por companyId (regla multi-tenant).
 */
import { and, eq, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assets,
  categories,
  maintenances,
  repairs,
  warranties,
} from "@/lib/db/schema";

/* ── KPIs generales ── */

/** Conteo de activos por estado, en una sola query. */
export async function countAssetsByStatus(companyId: string) {
  return db
    .select({ status: assets.status, count: sql<number>`count(*)::int` })
    .from(assets)
    .where(eq(assets.companyId, companyId))
    .groupBy(assets.status);
}

/**
 * Costos por mes de los últimos 12 meses, separados por origen
 * (compra / mantenimiento / reparación). Se agrupa por fuente y se
 * mezcla en el service.
 */
export async function monthlyPurchaseCosts(companyId: string, since: Date) {
  return db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${assets.purchaseDate}), 'YYYY-MM')`,
      total: sql<string>`coalesce(sum(${assets.purchasePrice}), 0)::text`,
    })
    .from(assets)
    .where(
      and(
        eq(assets.companyId, companyId),
        gte(assets.purchaseDate, since),
      ),
    )
    .groupBy(sql`date_trunc('month', ${assets.purchaseDate})`)
    .orderBy(sql`date_trunc('month', ${assets.purchaseDate})`);
}

export async function monthlyMaintenanceCosts(companyId: string, since: Date) {
  return db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${maintenances.performedAt}), 'YYYY-MM')`,
      total: sql<string>`coalesce(sum(${maintenances.cost}), 0)::text`,
    })
    .from(maintenances)
    .where(
      and(
        eq(maintenances.companyId, companyId),
        gte(maintenances.performedAt, since),
      ),
    )
    .groupBy(sql`date_trunc('month', ${maintenances.performedAt})`)
    .orderBy(sql`date_trunc('month', ${maintenances.performedAt})`);
}

export async function monthlyRepairCosts(companyId: string, since: Date) {
  return db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${repairs.repairedAt}), 'YYYY-MM')`,
      total: sql<string>`coalesce(sum(${repairs.cost}), 0)::text`,
    })
    .from(repairs)
    .where(
      and(eq(repairs.companyId, companyId), gte(repairs.repairedAt, since)),
    )
    .groupBy(sql`date_trunc('month', ${repairs.repairedAt})`)
    .orderBy(sql`date_trunc('month', ${repairs.repairedAt})`);
}

/* ── Gráficas ── */

/** Activos por categoría (para el gráfico de barras). */
export async function countAssetsByCategory(companyId: string) {
  return db
    .select({
      name: categories.name,
      count: sql<number>`count(${assets.id})::int`,
    })
    .from(categories)
    .leftJoin(
      assets,
      and(
        eq(assets.categoryId, categories.id),
        eq(assets.companyId, companyId),
      ),
    )
    .where(eq(categories.companyId, companyId))
    .groupBy(categories.name)
    .orderBy(sql`count(${assets.id}) desc`);
}

/** Montos de inversión acumulados: compra + mantenimientos + reparaciones. */
export async function totalInvested(companyId: string) {
  const [purchase, maint, repair] = await Promise.all([
    db
      .select({
        total: sql<string>`coalesce(sum(${assets.purchasePrice}), 0)::text`,
      })
      .from(assets)
      .where(eq(assets.companyId, companyId)),
    db
      .select({
        total: sql<string>`coalesce(sum(${maintenances.cost}), 0)::text`,
      })
      .from(maintenances)
      .where(eq(maintenances.companyId, companyId)),
    db
      .select({ total: sql<string>`coalesce(sum(${repairs.cost}), 0)::text` })
      .from(repairs)
      .where(eq(repairs.companyId, companyId)),
  ]);

  return {
    purchase: purchase[0]?.total ?? "0",
    maintenance: maint[0]?.total ?? "0",
    repair: repair[0]?.total ?? "0",
  };
}

/* ── Garantías (KPIs + alertas) ── */

export interface WarrantyRow {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  endDate: Date;
}

/** Garantías vigentes que vencen dentro de los próximos `days` días. */
export async function listWarrantiesExpiringWithin(
  companyId: string,
  now: Date,
  days: number,
): Promise<WarrantyRow[]> {
  const limit = new Date(now.getTime() + days * 86_400_000);
  return db
    .select({
      id: warranties.id,
      assetId: warranties.assetId,
      assetCode: assets.code,
      assetName: assets.name,
      endDate: warranties.endDate,
    })
    .from(warranties)
    .innerJoin(assets, eq(assets.id, warranties.assetId))
    .where(
      and(
        eq(warranties.companyId, companyId),
        gte(warranties.endDate, now),
        lte(warranties.endDate, limit),
      ),
    )
    .orderBy(warranties.endDate);
}

/** Garantías ya vencidas (endDate < ahora). */
export async function listWarrantiesExpired(
  companyId: string,
  now: Date,
): Promise<WarrantyRow[]> {
  return db
    .select({
      id: warranties.id,
      assetId: warranties.assetId,
      assetCode: assets.code,
      assetName: assets.name,
      endDate: warranties.endDate,
    })
    .from(warranties)
    .innerJoin(assets, eq(assets.id, warranties.assetId))
    .where(
      and(eq(warranties.companyId, companyId), lt(warranties.endDate, now)),
    )
    .orderBy(warranties.endDate);
}

/** Total de garantías vigentes (endDate >= ahora). */
export async function countWarrantiesActive(companyId: string, now: Date) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(warranties)
    .where(
      and(eq(warranties.companyId, companyId), gte(warranties.endDate, now)),
    );
  return row?.count ?? 0;
}

/** Total de mantenimientos con fecha próxima programada en el futuro. */
export async function countScheduledMaintenances(companyId: string, now: Date) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(maintenances)
    .where(
      and(
        eq(maintenances.companyId, companyId),
        gte(maintenances.nextAt, now),
      ),
    );
  return row?.count ?? 0;
}
