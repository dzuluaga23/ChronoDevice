/**
 * Repositorio de alertas (garantías por vencer/vencidas y mantenimientos
 * programados). Toda query por empresa filtra por companyId; el cron lee
 * todas las empresas con queries globales marcadas como tales.
 */
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { alerts, assets } from "@/lib/db/schema";
import type { InferInsertModel } from "drizzle-orm";

export type AlertInsert = InferInsertModel<typeof alerts>;
export type AlertType = NonNullable<AlertInsert["type"]>;

/** Alertas de una empresa (pendientes primero, la más nueva primero). */
export async function listAlerts(companyId: string) {
  return db
    .select({
      id: alerts.id,
      type: alerts.type,
      dueDate: alerts.dueDate,
      status: alerts.status,
      createdAt: alerts.createdAt,
      assetId: alerts.assetId,
      assetCode: assets.code,
      assetName: assets.name,
    })
    .from(alerts)
    .leftJoin(assets, eq(assets.id, alerts.assetId))
    .where(eq(alerts.companyId, companyId))
    .orderBy(asc(alerts.status), desc(alerts.createdAt));
}

/** Número de alertas pendientes de una empresa. */
export async function countPendingAlerts(companyId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(alerts)
    .where(and(eq(alerts.companyId, companyId), eq(alerts.status, "pendiente")));
  return row?.count ?? 0;
}

/**
 * Dedupe del cron: ¿ya existe una alerta pendiente del mismo tipo para
 * el mismo activo y fecha? (assetId nullable → cubrir el caso null).
 */
export async function findPendingAlert(
  companyId: string,
  type: AlertType,
  assetId: string | null,
  dueDate: Date,
) {
  const [row] = await db
    .select({ id: alerts.id })
    .from(alerts)
    .where(
      and(
        eq(alerts.companyId, companyId),
        eq(alerts.type, type),
        eq(alerts.dueDate, dueDate),
        eq(alerts.status, "pendiente"),
        assetId === null
          ? isNull(alerts.assetId)
          : eq(alerts.assetId, assetId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function insertAlert(values: AlertInsert) {
  const [row] = await db.insert(alerts).values(values).returning();
  return row;
}

export async function getAlertRow(companyId: string, id: string) {
  const [row] = await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.companyId, companyId), eq(alerts.id, id)))
    .limit(1);
  return row ?? null;
}

export async function updateAlertRow(
  companyId: string,
  id: string,
  values: Partial<AlertInsert>,
) {
  const [row] = await db
    .update(alerts)
    .set(values)
    .where(and(eq(alerts.companyId, companyId), eq(alerts.id, id)))
    .returning();
  return row ?? null;
}

/**
 * CRON: todas las alertas pendientes de todas las empresas (query global
 * intencional — no es acceso multi-tenant, es el trabajo diario).
 */
export async function listAllPendingAlerts() {
  return db
    .select()
    .from(alerts)
    .where(eq(alerts.status, "pendiente"))
    .orderBy(asc(alerts.dueDate));
}

/**
 * CRON: todas las empresas que tienen al menos una alerta pendiente,
 * con el id de empresa (para agrupar los correos por destinatario).
 */
export async function listCompaniesWithPendingAlerts() {
  const rows = await db
    .selectDistinct({ companyId: alerts.companyId })
    .from(alerts)
    .where(eq(alerts.status, "pendiente"));
  return rows.map((r) => r.companyId);
}
