"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "cn";
import { Boxes, CalendarClock, LogOut, QrCode, Settings2 } from "lucide-react";
import { signOut } from "@/lib/auth-client";

interface AppSidebarProps {
  companyName: string;
  userEmail: string;
  role: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/activos", label: "Activos", icon: Boxes },
  { href: "/mantenimientos", label: "Próximos", icon: CalendarClock },
  { href: "/escanear", label: "Escanear", icon: QrCode },
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

  const nav = (
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
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
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
      {/* Sidebar en desktop */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        {nav}
      </aside>

      {/* Barra superior en móvil */}
      <div className="no-print fixed inset-x-0 top-0 z-40 flex items-center gap-1 overflow-x-auto border-b border-border bg-sidebar px-2 py-2 md:hidden">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                active
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onSignOut}
          className="ml-auto shrink-0 rounded-md p-2 text-muted-foreground"
          aria-label="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-4 pt-14 pb-10 md:px-8 md:pt-8">
        {children}
      </div>
    </div>
  );
}
