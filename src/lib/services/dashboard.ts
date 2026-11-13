/**
 * Service del dashboard: mezcla las agregaciones del repo y arma
 * los KPIs y las series listas para las gráficas.
 */
import * as dashboardRepo from "@/lib/repositories/dashboard";
import type { AuthContext } from "@/lib/auth/session";
import { countPendingAlerts } from "@/lib/repositories/alerts";

export interface Kpis {
  totalAssets: number;
  operativo: number;
  enMantenimiento: number;
  enReparacion: number;
  retirado: number;
  warrantiesActive: number;
  warrantiesExpiring: number;
  warrantiesExpired: number;
  maintenanceScheduled: number;
  pendingAlerts: number;
  invested: {
    purchase: string;
    maintenance: string;
    repair: string;
    total: string;
  };
}

export interface DashboardData {
  kpis: Kpis;
  byCategory: { name: string; count: number }[];
  byStatus: { name: string; count: number }[];
  monthlyCosts: {
    month: string;
    compra: number;
    mantenimiento: number;
    reparacion: number;
  }[];
}

const STATUS_LABELS: Record<string, string> = {
  operativo: "Operativo",
  en_mantenimiento: "En mantenimiento",
  en_reparacion: "En reparación",
  retirado: "Retirado",
};

export async function getDashboardData(
  ctx: AuthContext,
  now: Date,
): Promise<DashboardData> {
  const since = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    statusCounts,
    byCategory,
    monthlyPurchase,
    monthlyMaintenance,
    monthlyRepair,
    invested,
    expiring,
    expired,
    warrantiesActive,
    maintenanceScheduled,
    pendingAlerts,
  ] = await Promise.all([
    dashboardRepo.countAssetsByStatus(ctx.companyId),
    dashboardRepo.countAssetsByCategory(ctx.companyId),
    dashboardRepo.monthlyPurchaseCosts(ctx.companyId, since),
    dashboardRepo.monthlyMaintenanceCosts(ctx.companyId, since),
    dashboardRepo.monthlyRepairCosts(ctx.companyId, since),
    dashboardRepo.totalInvested(ctx.companyId),
    dashboardRepo.listWarrantiesExpiringWithin(ctx.companyId, now, 30),
    dashboardRepo.listWarrantiesExpired(ctx.companyId, now),
    dashboardRepo.countWarrantiesActive(ctx.companyId, now),
    dashboardRepo.countScheduledMaintenances(ctx.companyId, now),
    countPendingAlerts(ctx.companyId),
  ]);

  const byStatusMap = Object.fromEntries(
    statusCounts.map((r) => [r.status, r.count]),
  );
  const totalAssets = statusCounts.reduce((acc, r) => acc + r.count, 0);

  // Mezcla de las 3 fuentes de costo por mes (rellenando los 12 meses).
  const monthMap = new Map<string, DashboardData["monthlyCosts"][number]>();
  const fill = (m: string) => {
    if (!monthMap.has(m)) {
      monthMap.set(m, {
        month: m,
        compra: 0,
        mantenimiento: 0,
        reparacion: 0,
      });
    }
    return monthMap.get(m)!;
  };
  for (const r of monthlyPurchase) fill(r.month).compra = Number(r.total);
  for (const r of monthlyMaintenance) {
    fill(r.month).mantenimiento = Number(r.total);
  }
  for (const r of monthlyRepair) fill(r.month).reparacion = Number(r.total);
  // Rellenar los 12 meses aunque no tengan movimientos.
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    fill(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const monthlyCosts = [...monthMap.values()].sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  const purchase = Number(invested.purchase);
  const maintenance = Number(invested.maintenance);
  const repair = Number(invested.repair);

  return {
    kpis: {
      totalAssets,
      operativo: byStatusMap["operativo"] ?? 0,
      enMantenimiento: byStatusMap["en_mantenimiento"] ?? 0,
      enReparacion: byStatusMap["en_reparacion"] ?? 0,
      retirado: byStatusMap["retirado"] ?? 0,
      warrantiesActive,
      warrantiesExpiring: expiring.length,
      warrantiesExpired: expired.length,
      maintenanceScheduled,
      pendingAlerts,
      invested: {
        purchase: invested.purchase,
        maintenance: invested.maintenance,
        repair: invested.repair,
        total: (purchase + maintenance + repair).toFixed(2),
      },
    },
    byCategory,
    byStatus: statusCounts.map((r) => ({
      name: STATUS_LABELS[r.status] ?? r.status,
      count: r.count,
    })),
    monthlyCosts,
  };
}
