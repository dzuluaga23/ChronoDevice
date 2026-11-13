"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Images,
  Trash2,
} from "lucide-react";
import { UploadDropzone } from "@/app/api/uploadthing/uploadthing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Galería de fotos y documentos del activo.
 * La subida va directa a UploadThing (con progreso) y al terminar el
 * backend ya registró el archivo en la BD (onUploadComplete).
 */

interface AttachmentRow {
  id: string;
  kind: "foto" | "documento";
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentsGallery({ assetId }: { assetId: string }) {
  const [items, setItems] = useState<AttachmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/assets/${assetId}/attachments`);
    if (res.ok) {
      const body = (await res.json()) as { data: AttachmentRow[] };
      setItems(body.data ?? []);
    }
    setLoading(false);
  }, [assetId]);

  useEffect(() => {
    // Carga inicial: setState tras await, no sincrónico en el effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function onDelete(row: AttachmentRow) {
    if (!window.confirm(`¿Borrar "${row.fileName}"?`)) return;
    const res = await fetch(`/api/attachments/${row.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      toast.error(body?.error?.message ?? "No se pudo borrar el archivo");
      return;
    }
    toast.success("Archivo eliminado");
    void load();
  }

  const photos = items.filter((a) => a.kind === "foto");
  const docs = items.filter((a) => a.kind === "documento");

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Images className="size-4 text-muted-foreground" />
        <CardTitle className="text-base">Fotos y documentos</CardTitle>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {items.length} archivo(s)
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <UploadDropzone
          endpoint="assetFiles"
          input={{ assetId }}
          onClientUploadComplete={() => {
            toast.success("Archivos subidos");
            void load();
          }}
          onUploadError={(error: Error) => {
            toast.error(error.message || "No se pudo subir el archivo");
          }}
        />

        {loading ? (
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay fotos ni documentos: sube facturas, fotos del equipo o
            certificados (PDF o imagen, hasta 8 MB cada uno).
          </p>
        ) : (
          <>
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((p) => (
                  <figure
                    key={p.id}
                    className="group relative overflow-hidden rounded-lg border border-border"
                  >
                    <a href={p.fileUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.fileUrl}
                        alt={p.fileName}
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </a>
                    <figcaption className="flex items-center justify-between gap-1 border-t border-border bg-muted/50 px-2 py-1">
                      <span className="min-w-0 truncate text-xs" title={p.fileName}>
                        {p.fileName}
                      </span>
                      <DeleteBtn onClick={() => onDelete(p)} />
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
            {docs.length > 0 && (
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate hover:underline"
                    >
                      {d.fileName}
                    </a>
                    <span className="font-mono text-xs text-muted-foreground">
                      {humanSize(d.sizeBytes)}
                    </span>
                    <DeleteBtn onClick={() => onDelete(d)} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Borrar archivo"
      onClick={onClick}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 />
    </Button>
  );
}
