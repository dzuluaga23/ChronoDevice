import { requireAuthOrRedirect } from "@/lib/auth/rsc";
import * as dashboardService from "@/lib/services/dashboard";
import { formatMoney } from "@/components/status-badge";
import MonthlyCostsChart from "@/components/dashboard/monthly-costs-chart";
import CategoryChart from "@/components/dashboard/category-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  CalendarClock,
  CircleCheck,
  DollarSign,
  Package,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

// Ruta privada: depende de la sesión en cada request.
export const instant = false;

export default async function DashboardPage() {
  const ctx = await requireAuthOrRedirect();
  const now = new Date();
  const data = await dashboardService.getDashboardData(ctx, now);
  const { kpis, byCategory, byStatus, monthlyCosts } = data;

  const kpiCards = [
    {
      label: "Activos totales",
      value: String(kpis.totalAssets),
      sub: `${kpis.operativo} operativos`,
      icon: Package,
      href: "/activos",
    },
    {
      label: "En mantenimiento / reparación",
      value: String(kpis.enMantenimiento + kpis.enReparacion),
      sub: `${kpis.enMantenimiento} mant. · ${kpis.enReparacion} repar.`,
      icon: CircleCheck,
      href: "/activos?estado=en_mantenimiento",
    },
    {
      label: "Inversión acumulada",
      value: formatMoney(kpis.invested.total),
      sub: `compra ${formatMoney(kpis.invested.purchase)} · serv. ${formatMoney(
        (Number(kpis.invested.maintenance) + Number(kpis.invested.repair)).toFixed(2),
      )}`,
      icon: DollarSign,
      href: null,
    },
    {
      label: "Garantías activas",
      value: String(kpis.warrantiesActive),
      sub: `${kpis.warrantiesExpiring} vencen en ≤30 días`,
      icon: ShieldCheck,
      href: "/alertas",
    },
    {
      label: "Mantenimientos programados",
      value: String(kpis.maintenanceScheduled),
      sub: "con fecha futura",
      icon: CalendarClock,
      href: "/mantenimientos",
    },
    {
      label: "Alertas pendientes",
      value: String(kpis.pendingAlerts),
      sub: kpis.pendingAlerts > 0 ? "revisar ahora" : "todo al día",
      icon: AlertTriangle,
      href: "/alertas",
      alert: kpis.pendingAlerts > 0,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de <span className="font-medium">{ctx.companyName}</span>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const content = (
            <Card
              className={
                "transition-shadow " +
                (kpi.alert
                  ? "border-destructive/40 bg-destructive/5"
                  : "hover:shadow-md")
              }
            >
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between gap-2 text-xs">
                  <span>{kpi.label}</span>
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                </CardDescription>
                <CardTitle className="text-xl font-bold sm:text-2xl">
                  {kpi.value}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                {kpi.sub}
              </CardContent>
            </Card>
          );
          return kpi.href ? (
            <Link key={kpi.label} href={kpi.href} className="contents">
              {content}
            </Link>
          ) : (
            <div key={kpi.label}>{content}</div>
          );
        })}
      </div>

      {/* Gráficas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyCostsChart data={monthlyCosts} />
        <div className="flex flex-col gap-4">
          <CategoryChart data={byCategory} />
          <StatusSummary byStatus={byStatus} />
        </div>
      </div>
    </div>
  );
}

function StatusSummary({
  byStatus,
}: {
  byStatus: { name: string; count: number }[];
}) {
  if (byStatus.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aún no hay activos registrados.
        </CardContent>
      </Card>
    );
  }
  const total = byStatus.reduce((acc, s) => acc + s.count, 0) || 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activos por estado</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {byStatus.map((s) => (
          <div key={s.name} className="flex items-center gap-3 text-sm">
            <span className="w-36 shrink-0 truncate text-muted-foreground">
              {s.name}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.round((s.count / total) * 100)}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono text-xs">{s.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
