import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CircleDollarSign, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge, formatDate, formatMoney } from "@/components/status-badge";
import { requireAuthOrRedirect } from "@/lib/auth/rsc";
import * as lifecycleRepo from "@/lib/repositories/lifecycle";
import * as assetsService from "@/lib/services/assets";

export const metadata = { title: "Detalle de activo" };
// Página privada: lee sesión/DB en cada request.
export const instant = false;

export default async function DetalleActivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuthOrRedirect();
  const { id } = await params;

  let asset: Awaited<ReturnType<typeof assetsService.getAsset>> | null;
  try {
    asset = await assetsService.getAsset(ctx, id);
  } catch {
    asset = null;
  }
  if (!asset) notFound();

  const [timeline, costs, warranties] = await Promise.all([
    lifecycleRepo.listAssetTimeline(ctx.companyId, id),
    lifecycleRepo.assetCostSummary(ctx.companyId, id),
    lifecycleRepo.listWarrantiesByAsset(ctx.companyId, id),
  ]);

  const purchase = asset.purchasePrice ? Number(asset.purchasePrice) : 0;
  const totalCost = purchase + Number(costs.maintenanceCost) + Number(costs.repairCost);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/activos">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              {asset.code}
            </span>
            <StatusBadge status={asset.status as string} />
          </div>
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {asset.name}
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href={`/activos/${asset.id}/editar`}>Editar</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Columna principal: ficha + historial */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Ficha técnica
            </CardHeader>
            <CardContent className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Info label="Categoría" value={asset.categoryName ?? "—"} />
              <Info label="Marca" value={asset.brandName ?? "—"} />
              <Info label="Modelo" value={asset.model ?? "—"} />
              <Info
                label="N° de serie"
                value={asset.serialNumber ?? "—"}
                mono
              />
              <Info label="Ubicación" value={asset.locationName ?? "—"} />
              <Info label="Proveedor" value={asset.supplierName ?? "—"} />
              <Info
                label="Fecha de compra"
                value={formatDate(asset.purchaseDate as string | null)}
              />
              <Info
                label="Precio de compra"
                value={formatMoney(asset.purchasePrice as string | null)}
                mono
              />
              {asset.notes && (
                <div className="sm:col-span-2">
                  <Info label="Notas" value={asset.notes} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Wrench className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Historial</CardTitle>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {timeline.length} evento(s)
              </span>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aún no hay mantenimientos ni reparaciones registrados.
                </p>
              ) : (
                <ol className="relative flex flex-col gap-6 border-l border-border pl-6">
                  {timeline.map((ev) => (
                    <li key={`${ev.kind}-${ev.id}`} className="relative">
                      <span
                        className={
                          "absolute top-1 -left-[calc(1.5rem+5px)] size-2.5 rounded-full ring-4 ring-card " +
                          (ev.kind === "repair"
                            ? "bg-status-reparacion"
                            : "bg-status-mantenimiento")
                        }
                      />
                      <div className="flex flex-wrap items-baseline gap-2">
                        <time
                          dateTime={new Date(ev.date).toISOString()}
                          className="font-mono text-xs text-muted-foreground"
                        >
                          {formatDate(ev.date)}
                        </time>
                        <span
                          className={
                            "rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase " +
                            (ev.kind === "repair"
                              ? "bg-status-reparacion/10 text-red-700 dark:text-red-400"
                              : "bg-status-mantenimiento/10 text-yellow-700 dark:text-yellow-400")
                          }
                        >
                          {ev.kind === "repair" ? "Reparación" : "Mantenimiento"}
                        </span>
                        {ev.cost && (
                          <span className="ml-auto font-mono text-xs">
                            {formatMoney(ev.cost)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm">{ev.description}</p>
                      {ev.technician && (
                        <p className="text-xs text-muted-foreground">
                          Técnico: {ev.technician}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral: costos + garantías */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <CircleDollarSign className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Costos acumulados</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 font-mono text-sm">
              <Row label="Compra" value={formatMoney(purchase.toFixed(2))} />
              <Row
                label="Mantenimientos"
                value={formatMoney(costs.maintenanceCost)}
              />
              <Row label="Reparaciones" value={formatMoney(costs.repairCost)} />
              <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatMoney(totalCost.toFixed(2))}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Garantías</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {warranties.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin garantía registrada.
                </p>
              ) : (
                warranties.map((w) => {
                  const ended = new Date(w.endDate) < new Date();
                  return (
                    <div
                      key={w.id}
                      className="rounded-lg border border-border p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {w.provider ?? "Garantía"}
                        </span>
                        <span
                          className={
                            "rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase " +
                            (ended
                              ? "bg-muted text-muted-foreground"
                              : "bg-status-garantia/10 text-blue-700 dark:text-blue-400")
                          }
                        >
                          {ended ? "Vencida" : "Activa"}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {formatDate(w.startDate)} → {formatDate(w.endDate)}
                      </p>
                      {w.coverageNotes && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {w.coverageNotes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className={mono ? "font-mono text-sm" : "text-sm"}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
