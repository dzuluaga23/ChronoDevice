import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, ArrowRight, QrCode, Wrench } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary font-mono text-xl font-bold text-primary-foreground">
          CD
        </div>
        <h1 className="text-4xl font-bold tracking-tight">ChronoDevice</h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          El historial clínico de los activos de tu empresa: compra,
          mantenimientos, reparaciones, garantía y retiro — todo el ciclo de
          vida de cada equipo en un solo lugar.
        </p>
      </div>

      {/* Vista previa del lenguaje visual del sistema */}
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription className="font-mono text-xs tracking-widest uppercase">
              AST-0001
            </CardDescription>
            <Badge className="font-mono text-[10px] tracking-wider uppercase">
              Operativo
            </Badge>
          </div>
          <CardTitle>Computador portátil ThinkPad</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wrench className="size-4" />
            <span className="font-mono">3 mantenimientos</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <QrCode className="size-4" />
            <span className="font-mono">QR listo</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button size="lg" asChild>
          <Link href="/registro">
            Empezar gratis
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/login">
            <Activity data-icon="inline-start" />
            Ya tengo cuenta
          </Link>
        </Button>
      </div>

      <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
        Multi-empresa · Historial completo · QR y alertas en camino
      </p>
    </main>
  );
}
