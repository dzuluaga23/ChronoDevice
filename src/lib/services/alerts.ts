/**
 * Service de alertas: listado, descarte y generación automática.
 * La generación (garantías por vencer/vencidas y mantenimientos próximos)
 * la usa el cron diario; evita duplicados por (tipo, activo, fecha).
 */
import { forbidden, notFound } from "@/lib/api/http";
import type { AuthContext } from "@/lib/auth/session";
import * as alertsRepo from "@/lib/repositories/alerts";
import * as dashboardRepo from "@/lib/repositories/dashboard";
import * as lifecycleRepo from "@/lib/repositories/lifecycle";

export async function listAlerts(ctx: AuthContext) {
  return alertsRepo.listAlerts(ctx.companyId);
}

export async function discardAlert(ctx: AuthContext, id: string) {
  const updated = await alertsRepo.updateAlertRow(ctx.companyId, id, {
    status: "descartada",
  });
  if (!updated) throw notFound("Alerta no encontrada");
  return updated;
}

/**
 * Genera las alertas pendientes de UNA empresa. Idempotente: si la alerta
 * ya existe (mismo tipo + activo + fecha), no la duplica.
 * Devuelve las alertas creadas en esta corrida.
 */
export async function generateAlertsForCompany(companyId: string, now: Date) {
  const created: { type: string; assetId: string | null; dueDate: Date }[] = [];

  const ensure = async (
    type: "garantia_vencida" | "garantia_por_vencer" | "mantenimiento_programado",
    assetId: string | null,
    dueDate: Date,
  ) => {
    const existing = await alertsRepo.findPendingAlert(
      companyId,
      type,
      assetId,
      dueDate,
    );
    if (existing) return;
    await alertsRepo.insertAlert({
      companyId,
      type,
      assetId,
      dueDate,
      status: "pendiente",
    });
    created.push({ type, assetId, dueDate });
  };

  // 1. Garantías que vencen en los próximos 30 días.
  const expiring = await dashboardRepo.listWarrantiesExpiringWithin(
    companyId,
    now,
    30,
  );
  for (const w of expiring) {
    // Truncar a medianoche para que el dedupe sea estable entre días.
    await ensure(
      "garantia_por_vencer",
      w.assetId,
      truncateToDay(w.endDate),
    );
  }

  // 2. Garantías vencidas hace ≤ 7 días (las muy viejas no generan ruido).
  const expired = await dashboardRepo.listWarrantiesExpired(companyId, now);
  const sevenDaysAgo = now.getTime() - 7 * 86_400_000;
  for (const w of expired) {
    if (w.endDate.getTime() >= sevenDaysAgo) {
      await ensure("garantia_vencida", w.assetId, truncateToDay(w.endDate));
    }
  }

  // 3. Mantenimientos programados para los próximos 7 días.
  const upcoming = await lifecycleRepo.listUpcomingMaintenances(companyId);
  const inSevenDays = now.getTime() + 7 * 86_400_000;
  for (const m of upcoming) {
    if (
      m.nextAt &&
      m.nextAt.getTime() <= inSevenDays &&
      m.nextAt.getTime() >= sevenDaysAgo
    ) {
      await ensure(
        "mantenimiento_programado",
        m.assetId,
        truncateToDay(m.nextAt),
      );
    }
  }

  return created;
}

function truncateToDay(d: Date): Date {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    12,
    0,
    0,
    0,
  );
}

/** Guarda de rol: solo admin y técnico gestionan alertas. */
export function assertCanManage(ctx: AuthContext) {
  if (!["admin", "tecnico"].includes(ctx.role)) {
    throw forbidden("Tu rol no permite gestionar alertas");
  }
}
