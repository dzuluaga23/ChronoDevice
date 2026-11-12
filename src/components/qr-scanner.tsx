"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, CameraOff, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Escáner QR con la cámara del celular (html5-qrcode, libre).
 * Al decodificar un QR de ChronoDevice (/q/{uuid}) navega a la ficha
 * del activo dentro de la app.
 */
export default function QrScanner() {
  const router = useRouter();
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (scanner) {
      try {
        await scanner.stop();
        await scanner.clear();
      } catch {
        // Ya estaba detenido; ignorar.
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  const onDecoded = useCallback(
    (decoded: string) => {
      void stop();
      // QR de ChronoDevice: {origin}/q/{uuid}
      try {
        const url = new URL(decoded);
        const match = url.pathname.match(/^\/q\/([0-9a-f-]{36})$/i);
        if (match) {
          router.push(`/activos/${match[1]}`);
          return;
        }
      } catch {
        // No es una URL: puede ser un QR ajeno o un código suelto.
      }
      // Si el texto es un uuid pelado, úsalo directo.
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded.trim())) {
        router.push(`/activos/${decoded.trim()}`);
        return;
      }
      toast.error("Ese QR no es de un activo de ChronoDevice");
    },
    [router, stop],
  );

  async function startScan() {
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    setScanning(true);
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => onDecoded(decoded),
        () => {
          // Errores por frame sin QR: ruido, ignorar.
        },
      );
    } catch (err) {
      setScanning(false);
      scannerRef.current = null;
      toast.error(
        "No se pudo abrir la cámara. ¿Le diste permiso? Usa el código de abajo como alternativa.",
        { description: err instanceof Error ? err.message : undefined },
      );
    }
  }

  function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = manualCode.trim();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      router.push(`/activos/${value}`);
      return;
    }
    // Si no es uuid, intenta como URL pegada.
    try {
      const url = new URL(value);
      const match = url.pathname.match(/^\/q\/([0-9a-f-]{36})$/i);
      if (match) {
        router.push(`/activos/${match[1]}`);
        return;
      }
    } catch {
      // no era URL
    }
    toast.error("Pega el enlace del QR (…/q/…) o su código");
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div
        id="qr-reader"
        className={
          "overflow-hidden rounded-xl border border-border bg-black " +
          (scanning ? "" : "hidden")
        }
      />
      {!scanning && (
        <Button onClick={startScan} size="lg">
          <Camera data-icon="inline-start" />
          Escanear con la cámara
        </Button>
      )}
      {scanning && (
        <Button variant="outline" onClick={() => void stop()}>
          <CameraOff data-icon="inline-start" />
          Detener cámara
        </Button>
      )}

      <div className="flex items-center gap-2">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          o manual
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onManualSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Keyboard className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Pega el enlace del QR"
            className="pl-8 font-mono text-xs"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Útil si el QR es de papel y la cámara no lo lee: ábrelo desde el
        celular y pega el enlace aquí.
      </p>
    </div>
  );
}
