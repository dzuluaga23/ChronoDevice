"use client";

/**
 * Búsqueda global (Ctrl+K): dialog con input y resultados de activos
 * en vivo. Se monta una vez en el shell; el disparador de escritorio
 * (sidebar) puede abrirlo con el evento "chronodevice:open-search".
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";

interface Hit {
  id: string;
  code: string;
  name: string;
  status: string;
  model: string | null;
}

export const OPEN_SEARCH_EVENT = "chronodevice:open-search";

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  /** Consulta con la que coinciden los hits actuales (para "cargando"). */
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveQ = q.trim();
  const loading = open && effectiveQ.length >= 2 && fetchedFor !== effectiveQ;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (timer.current) clearTimeout(timer.current);
    if (effectiveQ.length < 2) return;
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(effectiveQ)}`);
        const body = await res.json();
        setHits(res.ok ? body.data : []);
      } catch {
        setHits([]);
      } finally {
        setFetchedFor(effectiveQ);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [effectiveQ, open]);

  const go = useCallback(
    (id: string) => {
      setOpen(false);
      setQ("");
      setHits([]);
      router.push(`/activos/${id}`);
    },
    [router],
  );

  return (
    <>
      {/* Móvil: barra de búsqueda compacta (icono) en el topbar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-md p-2 text-muted-foreground md:hidden"
        aria-label="Buscar activos (Ctrl+K)"
      >
        <Search className="size-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent align="top" className="max-w-lg">
          <DialogTitle className="sr-only">Búsqueda global</DialogTitle>
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Código, nombre, modelo o serie…"
              className="h-8 border-0 shadow-none focus-visible:ring-0"
            />
            <kbd className="hidden rounded border border-border px-1.5 font-mono text-[10px] text-muted-foreground sm:block">
              Ctrl+K
            </kbd>
          </div>
          <div className="max-h-80 overflow-y-auto p-1">
            {loading ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Buscando…
              </p>
            ) : effectiveQ.length < 2 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Escribe al menos 2 letras. Busca en tus activos.
              </p>
            ) : fetchedFor !== effectiveQ || hits.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Sin resultados para «{effectiveQ}».
              </p>
            ) : (
              hits.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => go(hit.id)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {hit.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{hit.name}</span>
                  <StatusBadge status={hit.status} />
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
