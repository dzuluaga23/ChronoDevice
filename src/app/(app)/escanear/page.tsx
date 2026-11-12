import { requireAuthOrRedirect } from "@/lib/auth/rsc";
import QrScanner from "@/components/qr-scanner";

export const metadata = { title: "Escanear QR" };
// Página privada: lee sesión en cada request.
export const instant = false;

export default async function EscanearPage() {
  await requireAuthOrRedirect();
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Escanear QR</h1>
        <p className="text-sm text-muted-foreground">
          Apunta la cámara a la etiqueta de un equipo para abrir su ficha.
        </p>
      </div>
      <QrScanner />
    </div>
  );
}
