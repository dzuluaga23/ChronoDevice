"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "cn";
import { BellRing, Boxes, CalendarClock, LayoutDashboard, LogOut, QrCode, Search, Settings2 } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import GlobalSearch, { OPEN_SEARCH_EVENT } from "@/components/global-search";

interface AppSidebarProps {
  companyName: string;
  userEmail: string;
  role: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/activos", label: "Inventario", icon: Boxes },
  { href: "/mantenimientos", label: "Agenda", icon: CalendarClock },
  { href: "/alertas", label: "Alertas", icon: BellRing },
  { href: "/escanear", label: "Escanear QR", icon: QrCode },
  { href: "/catalogos", label: "Catálogos", icon: Settings2 },
];

export default function AppSidebar({
  companyName,
  userEmail,
  role,
  children,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function onSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  /* Navegación del sidebar (desktop) */
  const sidebarNav = (
    <>
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-mono text-xs font-bold text-primary-foreground">
          CD
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{companyName}</p>
          <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            {userEmail} · {role}
          </p>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primary/15 text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      {/* Desktop: caja de búsqueda (Ctrl+K) */}
      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))}
          className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search className="size-4" />
          Buscar…
          <kbd className="ml-auto rounded border border-border px-1.5 font-mono text-[10px]">
            Ctrl+K
          </kbd>
        </button>
      </div>
      <div className="mt-auto border-t border-border p-2">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-svh flex-1">
      {/* Desktop: sidebar lateral */}
      <aside className="no-print sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-sidebar sm:flex">
        {sidebarNav}
      </aside>

      {/* Móvil + desktop: la página vive en una columna */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Móvil: topbar sticky DENTRO del flujo — nunca encima del contenido */}
        <header className="no-print sticky top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-border bg-sidebar px-2 py-2 sm:hidden">
          <Link
            href="/activos"
            className="flex shrink-0 items-center rounded-md bg-primary px-2 py-1 font-mono text-xs font-bold text-primary-foreground"
            aria-label="Inicio"
          >
            CD
          </Link>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                isActive(item.href)
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
          <GlobalSearch />
          <button
            type="button"
            onClick={onSignOut}
            className="ml-auto shrink-0 rounded-md p-2 text-muted-foreground"
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </button>
        </header>

        <div className="flex flex-1 flex-col px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
