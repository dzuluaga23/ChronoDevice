"use client";

/**
 * Botón «Descargar PDF» del historial del activo. Genera el PDF en el
 * navegador con jsPDF + AutoTable (import dinámico: solo se descarga
 * la librería cuando el usuario pide el PDF).
 */
import { useState } from "react";
import { toast } from "sonner";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function HistoryPdfButton({
  asset,
  timeline,
  costs,
  companyName,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const [{ jsPDF }, autoTableMod] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableMod.default;

      const doc = new jsPDF({ orientation: "portrait" });

      doc.setFontSize(16);
      doc.text("ChronoDevice", 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(companyName, 14, 24);

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`${asset.code} — ${asset.name}`, 14, 34);

      // Ficha técnica
      autoTable(doc, {
        startY: 40,
        head: [["Ficha técnica", ""]],
        body: [
          ["Estado", STATUS_LABELS[asset.status] ?? asset.status],
          ["Categoría", asset.categoryName ?? "—"],
          ["Marca", asset.brandName ?? "—"],
          ["Modelo", asset.model ?? "—"],
          ["N° de serie", asset.serialNumber ?? "—"],
          ["Ubicación", asset.locationName ?? "—"],
          ["Proveedor", asset.supplierName ?? "—"],
          ["Fecha de compra", dateEs(asset.purchaseDate)],
          ["Precio de compra", money(asset.purchasePrice)],
        ],
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [99, 102, 241] },
        columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" } },
      });

      // Historial
      const events = timeline
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date));
      autoTable(doc, {
        head: [
          [
            "Fecha",
            "Tipo",
            "Descripción",
            "Técnico",
            "Costo",
          ],
        ],
        body: events.map((ev) => [
          dateEs(ev.date),
          ev.kind === "maintenance" ? "Mantenimiento" : "Reparación",
          ev.description,
          ev.technician ?? "—",
          money(ev.cost),
        ]),
        theme: "striped",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 41, 59] },
        didDrawPage: () => {
          doc.setFontSize(8);
          doc.setTextColor(140);
          doc.text(
            `Generado ${dateEs(new Date().toISOString())} · ChronoDevice`,
            14,
            doc.internal.pageSize.getHeight() - 8,
          );
        },
      });

      // Costos al final
      const finalY =
        (
          doc as unknown as { lastAutoTable?: { finalY: number } }
        ).lastAutoTable?.finalY ?? doc.internal.pageSize.getHeight() - 30;
      autoTable(doc, {
        startY: finalY + 8,
        head: [["Resumen de costos", ""]],
        body: [
          ["Compra", money(costs.purchase)],
          ["Mantenimientos", money(costs.maintenance)],
          ["Reparaciones", money(costs.repair)],
          ["TOTAL", money(costs.total)],
        ],
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [99, 102, 241] },
        columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" } },
      });

      doc.save(`historial-${asset.code}.pdf`);
      toast.success("PDF descargado");
    } catch {
      toast.error("No se pudo generar el PDF");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={generate} disabled={busy}>
      <FileDown data-icon="inline-start" />
      {busy ? "Generando…" : "Historial PDF"}
    </Button>
  );
}
