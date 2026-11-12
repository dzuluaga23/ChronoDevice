"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

/**
 * CRUD de los 4 catálogos en pestañas. Los formularios se generan
 * desde la config de campos de cada catálogo.
 */

type Field = {
  name: string;
  label: string;
  required?: boolean;
  textarea?: boolean;
  maxLength?: number;
};

interface KindConfig {
  kind: string;
  label: string;
  hint: string;
  fields: Field[];
}

const KINDS: KindConfig[] = [
  {
    kind: "categories",
    label: "Categorías",
    hint: "Tipos de equipo: computadores, impresoras, herramientas…",
    fields: [
      { name: "name", label: "Nombre", required: true, maxLength: 120 },
      {
        name: "description",
        label: "Descripción",
        textarea: true,
        maxLength: 500,
      },
    ],
  },
  {
    kind: "brands",
    label: "Marcas",
    hint: "Fabricantes de tus equipos",
    fields: [{ name: "name", label: "Nombre", required: true, maxLength: 120 }],
  },
  {
    kind: "locations",
    label: "Ubicaciones",
    hint: "Dónde vive cada equipo: sede, oficina, piso…",
    fields: [
      { name: "name", label: "Nombre", required: true, maxLength: 120 },
      { name: "address", label: "Dirección", maxLength: 300 },
    ],
  },
  {
    kind: "suppliers",
    label: "Proveedores",
    hint: "Quién te vendió los equipos o hace el mantenimiento",
    fields: [
      { name: "name", label: "Nombre", required: true, maxLength: 120 },
      { name: "contactName", label: "Contacto", maxLength: 120 },
      { name: "phone", label: "Teléfono", maxLength: 40 },
      { name: "email", label: "Email", maxLength: 200 },
      { name: "notes", label: "Notas", textarea: true, maxLength: 2000 },
    ],
  },
];

interface Row {
  id: string;
  name: string;
  [key: string]: unknown;
}

async function api<T>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const res = await fetch(url, init);
  const body = (await res.json().catch(() => null)) as
    | { data?: T; error?: { message?: string } }
    | null;
  if (!res.ok) {
    return { ok: false, error: body?.error?.message ?? "Error inesperado" };
  }
  return { ok: true, data: body?.data ?? undefined };
}

export default function CatalogManager() {
  const [items, setItems] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [editing, setEditing] = useState<{
    config: KindConfig;
    row: Row | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    const results = await Promise.all(
      KINDS.map(async (k) => {
        const res = await api<Row[]>(`/api/${k.kind}`);
        return [k.kind, res.data ?? []] as const;
      }),
    );
    setItems(Object.fromEntries(results));
    setLoading(false);
  }, []);

  useEffect(() => {
    // Carga inicial desde la API: los setState ocurren tras await (async),
    // no sincrónicamente en el cuerpo del effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll();
  }, [loadAll]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const field of editing.config.fields) {
      const v = fd.get(field.name);
      payload[field.name] =
        typeof v === "string" && v.trim() !== "" ? v.trim() : null;
    }

    const url = editing.row
      ? `/api/${editing.config.kind}/${editing.row.id}`
      : `/api/${editing.config.kind}`;
    const res = await api(url, {
      method: editing.row ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      toast.error(res.error);
      setSaving(false);
      return;
    }
    toast.success(editing.row ? "Actualizado" : "Creado");
    setEditing(null);
    setSaving(false);
    void loadAll();
  }

  async function onDelete(config: KindConfig, row: Row) {
    if (!window.confirm(`¿Borrar "${row.name}"?`)) return;
    const res = await api(`/api/${config.kind}/${row.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Eliminado");
    void loadAll();
  }

  return (
    <Tabs defaultValue={KINDS[0].kind}>
      <TabsList>
        {KINDS.map((k) => (
          <TabsTrigger key={k.kind} value={k.kind}>
            {k.label}
            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
              {items[k.kind]?.length ?? 0}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {KINDS.map((k) => (
        <TabsContent key={k.kind} value={k.kind} className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{k.hint}</p>
            <Button size="sm" onClick={() => setEditing({ config: k, row: null })}>
              <Plus data-icon="inline-start" />
              Nuevo
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            {loading ? (
              <div className="flex flex-col gap-2 p-4">
                <div className="h-9 animate-pulse rounded-md bg-muted" />
                <div className="h-9 animate-pulse rounded-md bg-muted" />
                <div className="h-9 animate-pulse rounded-md bg-muted" />
              </div>
            ) : (items[k.kind]?.length ?? 0) === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aún no hay {k.label.toLowerCase()}. Crea la primera con el
                botón «Nuevo».
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {items[k.kind]!.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {row.name}
                    </span>
                    <span className="hidden max-w-64 truncate text-muted-foreground sm:block">
                      {secondaryText(k.kind, row)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Editar ${row.name}`}
                      onClick={() => setEditing({ config: k, row })}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Borrar ${row.name}`}
                      onClick={() => onDelete(k, row)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      ))}

      {/* Dialog crear/editar */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing?.row ? `Editar ${editing.config.label.toLowerCase().slice(0, -1)}` : `Nuevo en ${editing?.config.label.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>{editing?.config.hint}</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {editing?.config.fields.map((field) => (
              <div key={field.name} className="flex flex-col gap-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.textarea ? (
                  <Textarea
                    id={field.name}
                    name={field.name}
                    maxLength={field.maxLength}
                    defaultValue={
                      (editing.row?.[field.name] as string | undefined) ?? ""
                    }
                  />
                ) : (
                  <Input
                    id={field.name}
                    name={field.name}
                    required={field.required}
                    maxLength={field.maxLength}
                    defaultValue={
                      (editing.row?.[field.name] as string | undefined) ?? ""
                    }
                  />
                )}
              </div>
            ))}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

/** Texto secundario por fila, según el catálogo. */
function secondaryText(kind: string, row: Row): string {
  switch (kind) {
    case "categories":
      return (row.description as string) ?? "";
    case "locations":
      return (row.address as string) ?? "";
    case "suppliers":
      return (
        [row.contactName, row.email].filter(Boolean).join(" · ") as string
      ) ?? "";
    default:
      return "";
  }
}
