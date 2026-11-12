import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { requireAuthOrRedirect } from "@/lib/auth/rsc";
import * as assetsService from "@/lib/services/assets";

export const metadata = { title: "Etiqueta QR" };
// Página privada: lee sesión/DB en cada request.
export const instant = false;

/**
 * Etiqueta imprimible por activo: QR + código + nombre + empresa.
 * El QR apunta a la página pública /q/[id] (sin login, datos no sensibles).
 */
export default async function EtiquetaQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuthOrRedirect();
  const { id } = await params;

  let asset: Awaited<ReturnType<typeof assetsService.getAsset>> | null;
  try {
    asset = await assetsService.getAsset(ctx, id);
  } catch {
    asset = null;
  }
  if (!asset) notFound();

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const publicUrl = `${proto}://${host}/q/${asset.id}`;

  const qrDataUrl = await QRCode.toDataURL(publicUrl, {
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" className="no-print">
          <Link href={`/activos/${asset.id}`}>
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Etiqueta QR · {asset.code}
          </h1>
          <p className="text-sm text-muted-foreground">
            Imprímela y pégala en el equipo: quien la escanee verá su ficha
            pública sin entrar a la app.
          </p>
        </div>
        <PrintButton />
      </div>

      {/* La etiqueta en sí: es lo único que sale al imprimir */}
      <div className="flex flex-1 items-start justify-center">
        <div
          id="qr-label"
          className="qr-label flex w-[22rem] flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center"
        >
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            {ctx.companyName}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR de ${asset.code}`}
            className="size-56"
          />
          <div>
            <p className="font-mono text-sm font-bold tracking-wider">
              {asset.code}
            </p>
            <p className="mt-1 text-lg leading-tight font-semibold">
              {asset.name}
            </p>
            {asset.brandName && (
              <p className="text-sm text-muted-foreground">
                {asset.brandName}
                {asset.model ? ` · ${asset.model}` : ""}
              </p>
            )}
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">
            Escanea para ver la ficha del equipo
          </p>
        </div>
      </div>
    </div>
  );
}
