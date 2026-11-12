import { cn } from "cn";

const STATUS_CONFIG = {
  operativo: { label: "Operativo", dot: "bg-status-operativo" },
  en_mantenimiento: { label: "En mantenimiento", dot: "bg-status-mantenimiento" },
  en_reparacion: { label: "En reparación", dot: "bg-status-reparacion" },
  retirado: { label: "Retirado", dot: "bg-status-retirado" },
} as const;

export type AssetStatus = keyof typeof STATUS_CONFIG;

/** Badge de estado del ciclo de vida (Chrono UI: punto de color + texto). */
export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = STATUS_CONFIG[status as AssetStatus] ?? {
    label: status,
    dot: "bg-status-retirado",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-foreground",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

/** Formatea montos en pesos colombianos. */
export function formatMoney(value: string | null | undefined): string {
  if (!value) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Fecha corta es-CO. */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
