"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { formatDate } from "@/components/status-badge";

/**
 * Tarjetas de garantía con borrado (DELETE /api/warranties/[id]).
 * Recibe las filas del servidor; las fechas llegan como Date | string.
 */
interface WarrantyRow {
  id: string;
  provider: string | null;
  startDate: string | Date;
  endDate: string | Date;
  coverageNotes: string | null;
}

export default function WarrantyList({
  warranties,
}: {
  warranties: WarrantyRow[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function onDelete(w: WarrantyRow) {
    if (!window.confirm("¿Borrar esta garantía?")) return;
    setDeleting(w.id);
    const res = await fetch(`/api/warranties/${w.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      toast.error(body?.error?.message ?? "No se pudo borrar la garantía");
      setDeleting(null);
      return;
    }
    toast.success("Garantía eliminada");
    setDeleting(null);
    router.refresh();
  }

  if (warranties.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sin garantía registrada.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {warranties.map((w) => {
        const ended = new Date(w.endDate) < new Date();
        return (
          <div
            key={w.id}
            className="group relative rounded-lg border border-border p-3 text-sm"
          >
            <button
              type="button"
              onClick={() => onDelete(w)}
              disabled={deleting === w.id}
              aria-label="Borrar garantía"
              className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 disabled:opacity-40"
            >
              <Trash2 className="size-3.5" />
            </button>
            <div className="flex items-center justify-between pr-6">
              <span className="font-medium">{w.provider ?? "Garantía"}</span>
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
      })}
    </div>
  );
}
