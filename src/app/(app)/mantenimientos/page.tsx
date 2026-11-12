import Link from "next/link";
import { CalendarClock, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, formatDate } from "@/components/status-badge";
import { requireAuthOrRedirect } from "@/lib/auth/rsc";
import * as lifecycleRepo from "@/lib/repositories/lifecycle";

export const metadata = { title: "Próximos mantenimientos" };
// Página privada: lee sesión/DB en cada request.
export const instant = false;

const TYPE_LABELS: Record<string, string> = {
  preventivo: "Preventivo",
  correctivo: "Correctivo",
  otros: "Otros",
};

interface UpcomingRow {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  assetStatus: string;
  type: string;
  nextAt: Date | null;
  technician: string | null;
}

export default async function ProximosPage() {
  const ctx = await requireAuthOrRedirect();
  const rows = await lifecycleRepo.listUpcomingMaintenances(ctx.companyId);

  // Un solo registro por activo: el más próximo (viene ordenado asc).
  const perAsset = new Map<string, UpcomingRow>();
  for (const r of rows) {
    if (!perAsset.has(r.assetId)) perAsset.set(r.assetId, r);
  }
  const items = [...perAsset.values()];

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const in30 = new Date(now);
  in30.setDate(in30.getDate() + 30);

  const overdue = items.filter(
    (r) => r.nextAt && new Date(r.nextAt) < now,
  );
  const soon = items.filter(
    (r) =>
      r.nextAt &&
      new Date(r.nextAt) >= now &&
      new Date(r.nextAt) <= in30,
  );
  const later = items.filter((r) => r.nextAt && new Date(r.nextAt) > in30);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Próximos mantenimientos
        </h1>
        <p className="text-sm text-muted-foreground">
          La fecha se programa al registrar un mantenimiento con «Próximo
          mantenimiento».
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <CalendarClock className="size-8 text-muted-foreground" />
          <p className="font-medium">Nada programado todavía</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Al registrar un mantenimiento y dejarle una fecha de «Próximo
            mantenimiento», el activo aparece aquí automáticamente.
          </p>
          <Button asChild variant="outline">
            <Link href="/activos">
              <CalendarPlus data-icon="inline-start" />
              Ir a activos
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <Section
            title="Vencidos"
            hint="Atiéndelos cuanto antes"
            items={overdue}
            tone="vencido"
            nowMs={now.getTime()}
          />
          <Section
            title="Próximos 30 días"
            hint=""
            items={soon}
            tone="normal"
            nowMs={now.getTime()}
          />
          <Section
            title="Más adelante"
            hint=""
            items={later}
            tone="normal"
            nowMs={now.getTime()}
          />
        </>
      )}
    </div>
  );
}

function Section({
  title,
  hint,
  items,
  tone,
  nowMs,
}: {
  title: string;
  hint: string;
  items: UpcomingRow[];
  tone: "vencido" | "normal";
  nowMs: number;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {title}
        </h2>
        <span className="font-mono text-xs text-muted-foreground">
          {items.length}
        </span>
        {hint && (
          <span className="text-xs text-muted-foreground">· {hint}</span>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <ul className="divide-y divide-border">
          {items.map((r) => {
            const date = r.nextAt ? new Date(r.nextAt) : null;
            const days = date
              ? Math.round(
                  (date.getTime() - nowMs) / (1000 * 60 * 60 * 24),
                )
              : 0;
            return (
              <li key={r.id} className="text-sm">
                <Link
                  href={`/activos/${r.assetId}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <span
                    className={
                      "w-28 shrink-0 font-mono text-xs " +
                      (tone === "vencido"
                        ? "font-semibold text-red-700 dark:text-red-400"
                        : "font-medium")
                    }
                  >
                    {formatDate(date)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium group-hover:underline">
                      {r.assetName}
                    </span>
                    <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                      {r.assetCode} · {TYPE_LABELS[r.type] ?? r.type}
                      {r.technician ? ` · ${r.technician}` : ""}
                    </span>
                  </span>
                  <span
                    className={
                      "hidden font-mono text-xs whitespace-nowrap sm:block " +
                      (tone === "vencido"
                        ? "text-red-700 dark:text-red-400"
                        : days <= 7
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-muted-foreground")
                    }
                  >
                    {tone === "vencido"
                      ? `vencido ${Math.abs(days)}d`
                      : days === 0
                        ? "hoy"
                        : `en ${days}d`}
                  </span>
                  <StatusBadge
                    status={r.assetStatus}
                    className="hidden md:inline-flex"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
