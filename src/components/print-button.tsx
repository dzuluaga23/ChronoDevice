"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Imprime la etiqueta: solo se imprime el área marcada como qr-label. */
export function PrintButton() {
  return (
    <Button
      size="sm"
      onClick={() => window.print()}
      className="no-print"
    >
      <Printer data-icon="inline-start" />
      Imprimir
    </Button>
  );
}
