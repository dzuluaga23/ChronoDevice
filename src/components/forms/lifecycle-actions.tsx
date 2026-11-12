"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  Hammer,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { maintenanceTypeValues } from "@/lib/validators/lifecycle";

/**
 * Acciones de ciclo de vida del activo: registra mantenimientos,
 * reparaciones y garantías desde el detalle. Al crear un evento
 * el backend cambia el estado del activo automáticamente.
 */

type Kind = "maintenance" | "repair" | "warranty";

const KIND_META: Record<
  Kind,
  { label: string; verb: string; icon: typeof Wrench }
> = {
  maintenance: {
    label: "Mantenimiento",
    verb: "Registrar mantenimiento",
    icon: Wrench,
  },
  repair: {
    label: "Reparación",
    verb: "Registrar reparación",
    icon: Hammer,
  },
  warranty: {
    label: "Garantía",
    verb: "Registrar garantía",
    icon: ShieldCheck,
  },
};

const TYPE_LABELS: Record<string, string> = {
  preventivo: "Preventivo",
  correctivo: "Correctivo",
  otros: "Otros",
};

/** FormData → string|null ("" y ausente son "sin valor"). */
function optional(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

/** Fecha de hoy en formato YYYY-MM-DD (zona local). */
function today(): string {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

export default function LifecycleActions({
  assetId,
  status,
}: {
  assetId: string;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<Kind | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFinalize() {
    setBusy(true);
    const res = await fetch(`/api/assets/${assetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "operativo" }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      toast.error(body?.error?.message ?? "No se pudo actualizar el estado");
      setBusy(false);
      return;
    }
    toast.success("Activo de vuelta en operación");
    setBusy(false);
    router.refresh();
  }

  async function onSubmit(
    kind: Kind,
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);

    let payload: Record<string, unknown>;
    switch (kind) {
      case "maintenance":
        payload = {
          type: optional(fd, "type") ?? "preventivo",
          performedAt: optional(fd, "performedAt"),
          nextAt: optional(fd, "nextAt"),
          description: optional(fd, "description"),
          cost: optional(fd, "cost"),
          technician: optional(fd, "technician"),
        };
        break;
      case "repair":
        payload = {
          failureDescription: optional(fd, "failureDescription"),
          repairedAt: optional(fd, "repairedAt"),
          solution: optional(fd, "solution"),
          cost: optional(fd, "cost"),
          technician: optional(fd, "technician"),
        };
        break;
      case "warranty":
        payload = {
          provider: optional(fd, "provider"),
          startDate: optional(fd, "startDate"),
          endDate: optional(fd, "endDate"),
          coverageNotes: optional(fd, "coverageNotes"),
        };
        break;
    }

    const res = await fetch(`/api/assets/${assetId}/${kind}s`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;

    if (!res.ok) {
      toast.error(
        body?.error?.message ?? `No se pudo registrar el ${KIND_META[kind].label.toLowerCase()}`,
      );
      setBusy(false);
      return;
    }

    toast.success(`${KIND_META[kind].label} registrado`);
    setOpen(null);
    setBusy(false);
    router.refresh();
  }

  const needsFinalize =
    status === "en_mantenimiento" || status === "en_reparacion";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(KIND_META) as Kind[]).map((kind) => {
          const meta = KIND_META[kind];
          return (
            <Button
              key={kind}
              size="sm"
              variant={kind === "maintenance" ? "default" : "outline"}
              onClick={() => setOpen(kind)}
              disabled={busy}
            >
              <meta.icon data-icon="inline-start" />
              {meta.verb}
            </Button>
          );
        })}
        {needsFinalize && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onFinalize}
            disabled={busy}
            className="text-status-operativo"
          >
            <CheckCircle2 data-icon="inline-start" />
            Finalizar · volver a operativo
          </Button>
        )}
      </div>

      <Dialog
        open={open !== null}
        onOpenChange={(o) => !o && !busy && setOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {open ? KIND_META[open].verb : ""}
            </DialogTitle>
            <DialogDescription>
              {open === "maintenance" &&
                "Queda registrado en el historial y el activo pasa a «En mantenimiento»."}
              {open === "repair" &&
                "Queda registrado en el historial y el activo pasa a «En reparación»."}
              {open === "warranty" &&
                "Cubre un rango de fechas; el detalle mostrará si está activa o vencida."}
            </DialogDescription>
          </DialogHeader>

          {open === "maintenance" && (
            <form
              onSubmit={(e) => onSubmit("maintenance", e)}
              className="flex flex-col gap-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select name="type" defaultValue="preventivo">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {maintenanceTypeValues.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="performedAt">Fecha del servicio</Label>
                  <Input
                    id="performedAt"
                    name="performedAt"
                    type="date"
                    defaultValue={today()}
                    required
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Qué se hizo *</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  maxLength={2000}
                  placeholder="Ej: cambio de aceite y revisión de filtros"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cost">Costo (COP)</Label>
                  <Input
                    id="cost"
                    name="cost"
                    inputMode="decimal"
                    pattern="\d{1,10}(\.\d{1,2})?"
                    placeholder="Ej: 85000.00"
                    className="font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="technician">Técnico</Label>
                  <Input
                    id="technician"
                    name="technician"
                    maxLength={120}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="nextAt">Próximo mantenimiento</Label>
                <Input
                  id="nextAt"
                  name="nextAt"
                  type="date"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Si lo dejas vacío no aparece en la agenda de próximos.
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(null)}
                  disabled={busy}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "Guardando…" : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          )}

          {open === "repair" && (
            <form
              onSubmit={(e) => onSubmit("repair", e)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="failureDescription">¿Qué falló? *</Label>
                <Textarea
                  id="failureDescription"
                  name="failureDescription"
                  required
                  maxLength={2000}
                  placeholder="Ej: no enciende, huele a quemado"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="repairedAt">Fecha de reparación</Label>
                  <Input
                    id="repairedAt"
                    name="repairedAt"
                    type="date"
                    defaultValue={today()}
                    required
                    className="font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cost">Costo (COP)</Label>
                  <Input
                    id="cost"
                    name="cost"
                    inputMode="decimal"
                    pattern="\d{1,10}(\.\d{1,2})?"
                    placeholder="Ej: 320000.00"
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="solution">Solución aplicada</Label>
                <Textarea
                  id="solution"
                  name="solution"
                  maxLength={2000}
                  placeholder="Ej: se cambió la fuente de poder"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="technician">Técnico</Label>
                <Input
                  id="technician"
                  name="technician"
                  maxLength={120}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(null)}
                  disabled={busy}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "Guardando…" : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          )}

          {open === "warranty" && (
            <form
              onSubmit={(e) => onSubmit("warranty", e)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="provider">Proveedor de la garantía</Label>
                <Input
                  id="provider"
                  name="provider"
                  maxLength={120}
                  placeholder="Ej: Apple Store"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="startDate">Desde *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={today()}
                    required
                    className="font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="endDate">Hasta *</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    required
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="coverageNotes">Qué cubre</Label>
                <Textarea
                  id="coverageNotes"
                  name="coverageNotes"
                  maxLength={2000}
                  placeholder="Ej: fallas de fabricación, 1 año"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(null)}
                  disabled={busy}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "Guardando…" : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
