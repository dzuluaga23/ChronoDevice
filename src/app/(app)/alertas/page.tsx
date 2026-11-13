import { requireAuthOrRedirect } from "@/lib/auth/rsc";
import * as alertsService from "@/lib/services/alerts";
import AlertsList, { type AlertItem } from "@/components/alerts-list";
import { countPendingAlerts } from "@/lib/repositories/alerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

// Ruta privada: depende de la sesión en cada request.
export const instant = false;

export default async function AlertsPage() {
  const ctx = await requireAuthOrRedirect();
  const [rows, pending] = await Promise.all([
    alertsService.listAlerts(ctx),
    countPendingAlerts(ctx.companyId),
  ]);

  const alerts: AlertItem[] = rows.map((a) => ({
    id: a.id,
    type: a.type,
    dueDate: a.dueDate.toISOString(),
    status: a.status,
    assetId: a.assetId,
    assetCode: a.assetCode,
    assetName: a.assetName,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alertas</h1>
        <p className="text-sm text-muted-foreground">
          {pending > 0
            ? `${pending} pendiente(s) de revisar`
            : "Todo al día"}
        </p>
      </div>

      <AlertsList alerts={alerts} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Info className="size-4 text-muted-foreground" />
            ¿Cómo se generan las alertas?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Un trabajo diario (Vercel Cron) revisa todas las garantías y
          mantenimientos programados:
          <ul className="mt-2 list-disc pl-5">
            <li>Garantía que vence en ≤ 30 días → «por vencer»</li>
            <li>Garantía vencida hace ≤ 7 días → «vencida»</li>
            <li>Mantenimiento programado en ≤ 7 días → «programado»</li>
          </ul>
          Si hay <span className="font-mono">RESEND_API_KEY</span> configurada,
          además llega un correo-resumen a los miembros de la empresa.
        </CardContent>
      </Card>
    </div>
  );
}
