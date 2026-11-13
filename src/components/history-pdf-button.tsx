"use client";

/**
 * Botón «Historial PDF» del activo: genera el PDF en el navegador con
 * jsPDF (import dinámico), lo muestra en una previsualización minimalista
 * (modal con el PDF real) y da la opción de descargar.
 * Diseño neutro: sin colores llamativos, tipografía y líneas grises.
 */
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { FileDown, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface PdfTimelineEvent {
  kind: "maintenance" | "repair";
  date: string; // ISO
  description: string;
  technician: string | null;
  cost: string | null;
}

export interface PdfAssetInfo {
  code: string;
  name: string;
  status: string;
  categoryName: string | null;
  brandName: string | null;
  model: string | null;
  serialNumber: string | null;
  locationName: string | null;
  supplierName: string | null;
  purchaseDate: string | null;
  purchasePrice: string | null;
}

interface Props {
  asset: PdfAssetInfo;
  timeline: PdfTimelineEvent[];
  costs: { purchase: string; maintenance: string; repair: string; total: string };
  companyName: string;
}

/* Paleta neutra (sin morados): pizarra + grises */
const INK: [number, number, number] = [15, 23, 42]; // texto fuerte
const MUTED: [number, number, number] = [100, 116, 139]; // texto suave
const LINE: [number, number, number] = [226, 232, 240]; // líneas de tabla
const SOFT: [number, number, number] = [248, 250, 252]; // zebra / fondo suave

const STATUS_LABELS: Record<string, string> = {
  operativo: "Operativo",
  en_mantenimiento: "En mantenimiento",
  en_reparacion: "En reparación",
  retirado: "Retirado",
};

function money(v: string | null): string {
  if (!v) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function dateEs(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

/** Genera el blob del PDF con jsPDF. Import dinámico: solo al pedirlo. */
async function buildHistoryPdf(input: Props): Promise<Blob> {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableMod.default;
  const { asset, timeline, costs, companyName } = input;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48; // margen

  /* ── Encabezado editorial (sin bloques de color) ── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("C H R O N O D E V I C E", M, 52);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(companyName, W - M, 52, { align: "right" });

  doc.setDrawColor(...INK);
  doc.setLineWidth(1.5);
  doc.line(M, 62, W - M, 62); // línea negra delgada: acento único del PDF

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...INK);
  doc.text(asset.name, M, 84);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(
    `${asset.code}  ·  ${STATUS_LABELS[asset.status] ?? asset.status}  ·  Historial al ${dateEs(
      new Date().toISOString(),
    )}`,
    M,
    100,
  );

  /* ── Ficha técnica: dos columnas sin relleno ── */
  autoTable(doc, {
    startY: 118,
    theme: "grid",
    head: [],
    body: [
      ["Categoría", asset.categoryName ?? "—", "N° de serie", asset.serialNumber ?? "—"],
      ["Marca", asset.brandName ?? "—", "Ubicación", asset.locationName ?? "—"],
      ["Modelo", asset.model ?? "—", "Proveedor", asset.supplierName ?? "—"],
      ["Fecha de compra", dateEs(asset.purchaseDate), "Precio de compra", money(asset.purchasePrice)],
    ],
    styles: {
      fontSize: 9,
      cellPadding: { top: 7, bottom: 7, left: 0, right: 0 },
      textColor: [...INK],
      lineColor: [...LINE],
      lineWidth: { top: 0, bottom: 0.5, left: 0, right: 0 },
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 95 },
      1: { cellWidth: 190, textColor: [...MUTED] },
      2: { fontStyle: "bold", cellWidth: 105 },
      3: { textColor: [...MUTED] },
    },
    margin: { left: M, right: M },
  });

  const lastFicha = (
    doc as unknown as { lastAutoTable?: { finalY: number } }
  ).lastAutoTable;
  let y = (lastFicha?.finalY ?? 118) + 28;

  /* ── Historial ── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Historial de eventos", M, y);
  y += 8;

  const events = timeline.slice().sort((a, b) => a.date.localeCompare(b.date));
  autoTable(doc, {
    startY: y,
    head: [["Fecha", "Tipo", "Descripción", "Técnico", "Costo"]],
    body:
      events.length > 0
        ? events.map((ev) => [
            dateEs(ev.date),
            ev.kind === "maintenance" ? "Mantenimiento" : "Reparación",
            ev.description,
            ev.technician ?? "—",
            money(ev.cost),
          ])
        : [["—", "—", "Sin eventos registrados todavía", "—", "—"]],
    theme: "striped",
    styles: {
      fontSize: 8.5,
      cellPadding: 6,
      textColor: [...INK],
      lineColor: [...LINE],
      lineWidth: { top: 0, bottom: 0.5, left: 0, right: 0 },
    },
    alternateRowStyles: { fillColor: [...SOFT] },
    headStyles: {
      fillColor: [...INK],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 66 },
      1: { cellWidth: 78 },
      3: { cellWidth: 84, textColor: [...MUTED] },
      4: { halign: "right" },
    },
    margin: { left: M, right: M },
    didDrawPage: () => {
      const h = doc.internal.pageSize.getHeight();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(
        `ChronoDevice · ${asset.code}`,
        M,
        h - 28,
      );
      doc.text(
        `Página ${doc.getCurrentPageInfo().pageNumber}`,
        W - M,
        h - 28,
        { align: "right" },
      );
    },
  });

  y = (
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y
  ) + 28;

  /* ── Resumen de costos (caja destacada) ── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Costos acumulados", M, y);
  y += 8;

  const boxH = 108;
  const boxW = 240;
  if (y + boxH > doc.internal.pageSize.getHeight() - 48) {
    doc.addPage();
    y = 60;
  }
  doc.setDrawColor(...INK);
  doc.setLineWidth(1);
  doc.rect(W - M - boxW, y, boxW, boxH); // caja con borde negro delgado

  const rows: [string, string, boolean][] = [
    ["Compra", money(costs.purchase), false],
    ["Mantenimientos", money(costs.maintenance), false],
    ["Reparaciones", money(costs.repair), false],
    ["TOTAL", money(costs.total), true],
  ];
  rows.forEach(([label, value, strong], i) => {
    const rowY = y + 22 + i * 22;
    doc.setFont("helvetica", strong ? "bold" : "normal");
    doc.setFontSize(strong ? 10 : 9);
    doc.setTextColor(...(strong ? INK : MUTED));
    doc.text(label, W - M - boxW + 12, rowY);
    doc.setTextColor(...INK);
    doc.text(value, W - M - 12, rowY, { align: "right" });
    if (i < rows.length - 1) {
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.5);
      doc.line(W - M - boxW + 12, rowY + 7, W - M - 12, rowY + 7);
    }
  });

  return doc.output("blob");
}

export default function HistoryPdfButton({
  asset,
  timeline,
  costs,
  companyName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [size, setSize] = useState(0);
  const [busy, setBusy] = useState(false);
  const urlRef = useRef<string | null>(null);

  const revoke = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  /** Cierre del modal: libera el blob (sin efect — limpieza en el callback). */
  function handleClose(next: boolean) {
    if (!next) {
      revoke();
      setUrl(null);
      setSize(0);
    }
    setOpen(next);
  }

  async function openPreview() {
    setBusy(true);
    try {
      revoke();
      const blob = await buildHistoryPdf({ asset, timeline, costs, companyName });
      const objectUrl = URL.createObjectURL(blob);
      urlRef.current = objectUrl;
      setSize(blob.size);
      setUrl(objectUrl);
      setOpen(true);
    } catch {
      toast.error("No se pudo generar el PDF");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial-${asset.code}.pdf`;
    a.click();
    toast.success("PDF descargado");
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={openPreview} disabled={busy}>
        <FileText data-icon="inline-start" />
        {busy ? "Generando…" : "Historial PDF"}
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="h-[85dvh] max-w-3xl gap-0 overflow-hidden p-0"
          showCloseButton={false}
        >
          {/* Barra superior minimalista */}
          <DialogTitle className="sr-only">Previsualización del PDF</DialogTitle>
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium">
                historial-{asset.code}.pdf
              </span>
              <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
                {size > 0 ? `${Math.round(size / 1024)} KB` : ""}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button size="sm" onClick={download}>
                <FileDown data-icon="inline-start" />
                Descargar
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleClose(false)}
                aria-label="Cerrar vista previa"
              >
                <X />
              </Button>
            </div>
          </div>

          {/* El PDF real, incrustado */}
          {url ? (
            <iframe
              src={url}
              title={`Historial de ${asset.code}`}
              className="min-h-0 flex-1 bg-muted"
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Generando vista previa…
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
