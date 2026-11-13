"use client";

/**
 * Lista del centro de alertas con botón de descartar (client porque
 * llama a la API y refresca la página).
 */
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { formatDate } from "@/components/status-badge";
import { BellOff, CalendarClock, ShieldCheck, ShieldX } from "lucide-react";

export interface AlertItem {
  id: string;
  type: string;
  dueDate: string;
  status: "pendiente" | "enviada" | "descartada";
  assetId: string | null;
  assetCode: string | null;
  assetName: string | null;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof ShieldCheck; tone: string }
> = {
  garantia_por_vencer: {
    label: "Garantía por vencer",
    icon: ShieldCheck,
    tone: "text-amber-600",
  },
  garantia_vencida: {
    label: "Garantía vencida",
    icon: ShieldX,
    tone: "text-destructive",
  },
  mantenimiento_programado: {
    label: "Mantenimiento programado",
    icon: CalendarClock,
    tone: "text-blue-600",
  },
};

export default function AlertsList({ alerts }: { alerts: AlertItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function discard(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "descartada" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error?.message ?? "No se pudo descartar");
        return;
      }
      toast.success("Alerta descartada");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <BellOff className="size-8 text-muted-foreground" />
          <p className="font-medium">Sin alertas</p>
          <p className="text-sm text-muted-foreground">
            Todo al día. Aquí aparecerán las garantías por vencer y los
            mantenimientos programados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => {
        const config = TYPE_CONFIG[alert.type] ?? {
          label: alert.type,
          icon: BellOff,
          tone: "text-muted-foreground",
        };
        const Icon = config.icon;
        const pending = alert.status === "pendiente";
        return (
          <Card
            key={alert.id}
            className={pending ? "" : "opacity-60"}
          >
            <CardContent className="flex items-center gap-3 py-3">
              <Icon className={`size-5 shrink-0 ${config.tone}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {config.label}
                  {alert.assetId ? (
                    <Link
                      href={`/activos/${alert.assetId}`}
                      className="ml-2 font-mono text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      {alert.assetCode} · {alert.assetName}
                    </Link>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  Fecha: {formatDate(alert.dueDate)}
                  {alert.status !== "pendiente" ? ` · ${alert.status}` : ""}
                </p>
              </div>
              {pending ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === alert.id}
                  onClick={() => discard(alert.id)}
                >
                  Descartar
                </Button>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
