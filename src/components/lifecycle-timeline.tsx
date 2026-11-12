"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { formatDate, formatMoney } from "@/components/status-badge";
import type { TimelineEvent } from "@/lib/repositories/lifecycle";

/**
 * Timeline del historial (server data, interacción cliente):
 * cada evento se puede borrar (DELETE /api/maintenances|repairs/[id]).
 */
export default function LifecycleTimeline({
  events,
}: {
  events: TimelineEvent[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function onDelete(ev: TimelineEvent) {
    if (
      !window.confirm(
        `¿Borrar el registro del ${formatDate(ev.date)}? Esta acción no se deshace.`,
      )
    )
      return;

    setDeleting(ev.id);
    const base = ev.kind === "repair" ? "/api/repairs" : "/api/maintenances";
    const res = await fetch(`${base}/${ev.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      toast.error(body?.error?.message ?? "No se pudo borrar el registro");
      setDeleting(null);
      return;
    }
    toast.success("Registro eliminado");
    setDeleting(null);
    router.refresh();
  }

  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Aún no hay mantenimientos ni reparaciones registrados.
      </p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-6 border-l border-border pl-6">
      {events.map((ev) => (
        <li key={`${ev.kind}-${ev.id}`} className="group relative">
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
            <button
              type="button"
              onClick={() => onDelete(ev)}
              disabled={deleting === ev.id}
              aria-label="Borrar registro"
              className="ml-1 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 disabled:opacity-40"
            >
              <Trash2 className="size-3.5" />
            </button>
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
  );
}
