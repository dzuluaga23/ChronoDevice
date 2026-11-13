import Link from "next/link";
import { Plus, QrCode, Search } from "lucide-react";import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, formatMoney } from "@/components/status-badge";
import { requireAuthOrRedirect } from "@/lib/auth/rsc";
import * as assetsService from "@/lib/services/assets";
import { assetStatusValues } from "@/lib/validators/asset";

export const metadata = { title: "Activos" };
// Página privada: lee sesión/DB en cada request.
export const instant = false;

const STATUS_LABELS: Record<string, string> = {
  operativo: "Operativo",
  en_mantenimiento: "En mantenimiento",
  en_reparacion: "En reparación",
  retirado: "Retirado",
};

export default async function ActivosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const ctx = await requireAuthOrRedirect();
  const params = await searchParams;

  // Parseo tolerante: si el usuario mete un status raro, se ignora.
  const q = params.q?.trim() || undefined;
  const status =
    params.status && assetStatusValues.includes(params.status as never)
      ? params.status
      : undefined;

  const { items, total } = await assetsService.listAssets(ctx.companyId, {
    q,
    status: status as never,
    limit: 100,
    offset: 0,
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activos</h1>
          <p className="text-sm text-muted-foreground">
            {total} activo(s) en inventario
          </p>
        </div>
        <Button asChild>
          <Link href="/activos/nuevo">
            <Plus data-icon="inline-start" />
            Nuevo activo
          </Link>
        </Button>
      </div>

      {/* Filtros: GET nativo, sin JS */}
      <form
        method="GET"
        action="/activos"
        className="flex flex-wrap items-center gap-2"
      >
        <div className="relative min-w-56 flex-1 sm:max-w-72">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre, código, serie…"
            className="h-8 w-full rounded-lg border border-input bg-transparent py-1 pr-2 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Todos los estados</option>
          {assetStatusValues.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
        {(q || status) && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/activos">Limpiar</Link>
          </Button>
        )}
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="font-medium">No hay activos que mostrar</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Registra tu primer activo para empezar a llevar su historial:
            mantenimientos, reparaciones, garantía y costos.
          </p>
          <Button asChild variant="outline">
            <Link href="/activos/nuevo">
              <Plus data-icon="inline-start" />
              Registrar primer activo
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-mono text-xs">Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">
                  Categoría
                </TableHead>
                <TableHead className="hidden md:table-cell">Marca</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Ubicación
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Precio compra
                </TableHead>
                <TableHead className="text-center font-mono text-xs">
                  QR
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id} className="group relative">
                  <TableCell className="relative font-mono text-xs font-medium">
                    <Link
                      href={`/activos/${a.id}`}
                      className="absolute inset-0 z-10 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-label={`Ver ${a.name}`}
                    />
                    {a.code}
                  </TableCell>
                  <TableCell className="max-w-48 truncate font-medium group-hover:underline">
                    {a.name}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {a.categoryName ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {a.brandName ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {a.locationName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status as string} />
                  </TableCell>
                  <TableCell className="hidden text-right font-mono text-xs sm:table-cell">
                    {formatMoney(a.purchasePrice as string | null)}
                  </TableCell>
                  <TableCell className="w-12 text-center">
                    <Link
                      href={`/activos/${a.id}/qr`}
                      className="relative z-20 inline-flex rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={`Etiqueta QR de ${a.name}`}
                      title="Etiqueta QR"
                    >
                      <QrCode className="size-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
