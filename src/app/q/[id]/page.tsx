import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ShieldCheck } from "lucide-react";
import { StatusBadge, formatDate } from "@/components/status-badge";
import * as assetsRepo from "@/lib/repositories/assets";
import * as lifecycleRepo from "@/lib/repositories/lifecycle";

export const metadata = { title: "Ficha del equipo" };
// Lee la BD en cada request: no prerrenderizar.
export const instant = false;

/**
 * Página pública al escanear la etiqueta QR de un activo.
 * Sin login y solo datos no sensibles (sin serial, costos ni notas).
 */
export default async function FichaPublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // El id viene de un QR (uuid); si no tiene formato de uuid, Postgres
  // lanzaría un error de cast → 404 limpio.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  const asset = await assetsRepo.getPublicAssetById(id);
  if (!asset) notFound();

  const summary = await lifecycleRepo.publicSummaryByAssetId(id);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            {asset.code}
          </span>
          <StatusBadge status={asset.status as string} className="ml-auto" />
        </div>

        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {asset.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {asset.companyName}
        </p>

        <dl className="mt-5 flex flex-col gap-2.5 border-t border-border pt-4 text-sm">
          <Row label="Categoría" value={asset.categoryName} />
          <Row label="Marca" value={asset.brandName} />
          <Row label="Modelo" value={asset.model} />
          <Row label="Ubicación" value={asset.locationName} />
          <Row
            label="Garantía"
            icon={<ShieldCheck className="size-3.5" />}
            value={
              summary.warrantyUntil
                ? `Activa hasta ${formatDate(summary.warrantyUntil)}`
                : "Sin garantía vigente"
            }
            highlight={Boolean(summary.warrantyUntil)}
          />
          <Row
            label="Último mantenimiento"
            icon={<CalendarDays className="size-3.5" />}
            value={
              summary.lastMaintenanceAt
                ? formatDate(summary.lastMaintenanceAt)
                : "Sin registros"
            }
          />
        </dl>

        <p className="mt-5 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          ¿Encuentrate este equipo? Comunícate con {asset.companyName}.
        </p>
      </div>

      <p className="mt-6 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        Ficha generada con{" "}
        <Link href="/" className="underline underline-offset-2">
          ChronoDevice
        </Link>
      </p>
    </main>
  );
}

function Row({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {icon}
        {label}
      </dt>
      <dd
        className={
          "text-right " +
          (highlight ? "font-medium text-blue-700 dark:text-blue-400" : "")
        }
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}
