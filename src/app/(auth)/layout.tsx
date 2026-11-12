import type { ReactNode } from "react";

// Depende de la sesión para redirigir si ya está autenticado.
export const instant = false;

/** Layout centrado para las páginas de autenticación. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-1 flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary font-mono text-lg font-bold text-primary-foreground">
          CD
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight">ChronoDevice</span>
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            activos · garantías · mantenimiento
          </span>
        </div>
      </div>
      {children}
    </main>
  );
}
