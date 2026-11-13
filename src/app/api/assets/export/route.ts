/**
 * Exportación CSV del inventario. Respuesta como archivo descargable.
 * Separador «;» y BOM UTF-8 para que Excel en español lo abra bien.
 */
import { handle } from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/session";
import * as assetsRepo from "@/lib/repositories/assets";
import { getCompanyById } from "@/lib/repositories/companies";

const STATUS_LABELS: Record<string, string> = {
  operativo: "Operativo",
  en_mantenimiento: "En mantenimiento",
  en_reparacion: "En reparación",
  retirado: "Retirado",
};

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  if (/[;"\n]/.test(s)) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

export const GET = handle(async () => {
  const ctx = await requireAuth();

  const [rows, company] = await Promise.all([
    assetsRepo.listAssetsForExport(ctx.companyId),
    getCompanyById(ctx.companyId),
  ]);

  const header = [
    "Código",
    "Nombre",
    "Categoría",
    "Marca",
    "Modelo",
    "N° de serie",
    "Estado",
    "Ubicación",
    "Proveedor",
    "Fecha compra",
    "Precio compra",
    "Notas",
  ];

  const lines = [header.join(";")];
  for (const a of rows) {
    lines.push(
      [
        a.code,
        a.name,
        a.categoryName,
        a.brandName,
        a.model,
        a.serialNumber,
        STATUS_LABELS[a.status as string] ?? a.status,
        a.locationName,
        a.supplierName,
        a.purchaseDate,
        a.purchasePrice,
        a.notes,
      ]
        .map(csvCell)
        .join(";"),
    );
  }

  const slug = company?.slug ?? "inventario";
  const csv = "\uFEFF" + lines.join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chronodevice-${slug}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
});
