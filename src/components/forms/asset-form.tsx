"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

/**
 * Formulario de activos — create y edit comparten este componente.
 * Los catálogos y los responsables se cargan de la API (misma empresa).
 */

interface Option {
  id: string;
  name: string;
}

interface AssetInitial {
  id: string;
  name: string;
  categoryId?: string | null;
  brandId?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  status?: string | null;
  locationId?: string | null;
  supplierId?: string | null;
  responsibleUserId?: string | null;
  purchaseDate?: string | Date | null;
  purchasePrice?: string | null;
  notes?: string | null;
}

const STATUS_OPTIONS = [
  { value: "operativo", label: "Operativo" },
  { value: "en_mantenimiento", label: "En mantenimiento" },
  { value: "en_reparacion", label: "En reparación" },
  { value: "retirado", label: "Retirado" },
];

/** Radix Select no admite value="": centinela para "sin valor". */
const NONE = "__none__";

async function fetchList(url: string): Promise<Option[]> {
  const res = await fetch(url);
  if (!res.ok) return [];
  const body = (await res.json()) as { data: Option[] };
  return body.data;
}

/** FormData → payload; NONE significa "sin valor" (null). */
function optionalField(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "" || v === NONE) return null;
  return v.trim();
}

export default function AssetForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: AssetInitial;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "create");
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [locations, setLocations] = useState<Option[]>([]);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [responsibles, setResponsibles] = useState<
    (Option & { email?: string })[]
  >([]);

  useEffect(() => {
    if (mode !== "create") return;
    void (async () => {
      const [cats, brs, locs, sups, usersRes] = await Promise.all([
        fetchList("/api/categories"),
        fetchList("/api/brands"),
        fetchList("/api/locations"),
        fetchList("/api/suppliers"),
        fetch("/api/users").then(async (res) =>
          res.ok
            ? ((await res.json()) as { data: (Option & { email?: string })[] }).data
            : [],
        ),
      ]);
      setCategories(cats);
      setBrands(brs);
      setLocations(locs);
      setSuppliers(sups);
      setResponsibles(usersRes);
      setLoading(false);
    })();
  }, [mode]);

  const initialDate = initial?.purchaseDate
    ? new Date(initial.purchaseDate).toISOString().slice(0, 10)
    : "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData(e.currentTarget);

    const payload = {
      name: optionalField(fd, "name"),
      categoryId: optionalField(fd, "categoryId"),
      brandId: optionalField(fd, "brandId"),
      model: optionalField(fd, "model"),
      serialNumber: optionalField(fd, "serialNumber"),
      status: optionalField(fd, "status") ?? "operativo",
      locationId: optionalField(fd, "locationId"),
      supplierId: optionalField(fd, "supplierId"),
      responsibleUserId: optionalField(fd, "responsibleUserId"),
      purchaseDate: optionalField(fd, "purchaseDate"),
      purchasePrice: optionalField(fd, "purchasePrice"),
      notes: optionalField(fd, "notes"),
    };

    const res = await fetch(
      mode === "create" ? "/api/assets" : `/api/assets/${initial!.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const body = (await res.json().catch(() => null)) as
      | { data?: { id: string }; error?: { message?: string } }
      | null;

    if (!res.ok) {
      toast.error(body?.error?.message ?? "No se pudo guardar el activo");
      setSaving(false);
      return;
    }

    toast.success(
      mode === "create" ? "Activo registrado" : "Activo actualizado",
    );
    router.push(`/activos/${mode === "create" ? body!.data!.id : initial!.id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-3">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex max-w-3xl flex-col gap-6 rounded-xl border border-border bg-card p-6"
    >
      {/* Identificación */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Identificación
        </legend>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre del activo *</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={200}
            defaultValue={initial?.name ?? ""}
            placeholder="Ej: Portátil ThinkPad L14"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="categoryId">Categoría</Label>
            <Select
              name="categoryId"
              defaultValue={initial?.categoryId ?? NONE}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin categoría</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="brandId">Marca</Label>
            <Select name="brandId" defaultValue={initial?.brandId ?? NONE}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin marca</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="model">Modelo</Label>
            <Input
              id="model"
              name="model"
              maxLength={120}
              defaultValue={initial?.model ?? ""}
              placeholder="Ej: ThinkPad L14 Gen 4"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="serialNumber">Número de serie</Label>
            <Input
              id="serialNumber"
              name="serialNumber"
              maxLength={120}
              defaultValue={initial?.serialNumber ?? ""}
              className="font-mono"
            />
          </div>
        </div>
      </fieldset>

      {/* Estado y ubicación */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Estado y ubicación
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">Estado</Label>
            <Select name="status" defaultValue={initial?.status ?? "operativo"}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Operativo" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="locationId">Ubicación</Label>
            <Select
              name="locationId"
              defaultValue={initial?.locationId ?? NONE}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin ubicación</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="supplierId">Proveedor</Label>
            <Select
              name="supplierId"
              defaultValue={initial?.supplierId ?? NONE}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin proveedor</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="responsibleUserId">Responsable</Label>
            <Select
              name="responsibleUserId"
              defaultValue={initial?.responsibleUserId ?? NONE}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin responsable</SelectItem>
                {responsibles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {responsibles.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Solo hay responsables si el equipo de tu empresa está
                invitado a la app.
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Compra y notas */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Compra y notas
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="purchaseDate">Fecha de compra</Label>
            <Input
              id="purchaseDate"
              name="purchaseDate"
              type="date"
              defaultValue={initialDate}
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purchasePrice">Precio de compra (COP)</Label>
            <Input
              id="purchasePrice"
              name="purchasePrice"
              inputMode="decimal"
              pattern="\d{1,10}(\.\d{1,2})?"
              defaultValue={initial?.purchasePrice ?? ""}
              placeholder="Ej: 3250000.00"
              className="font-mono"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            name="notes"
            maxLength={2000}
            defaultValue={initial?.notes ?? ""}
            placeholder="Observaciones, accesorios, configuración especial…"
          />
        </div>
      </fieldset>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving
            ? "Guardando…"
            : mode === "create"
              ? "Registrar activo"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
