import { requireAuthOrRedirect } from "@/lib/auth/rsc";
import AppSidebar from "@/components/app-sidebar";

// Rutas privadas: dependen de la sesión (cookies) en cada request.
export const instant = false;

/** Layout de la app: exige sesión + empresa, renderiza el sidebar. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAuthOrRedirect();
  return (
    <AppSidebar
      companyName={ctx.companyName}
      userEmail={ctx.userEmail}
      role={ctx.role}
    >
      {children}
    </AppSidebar>
  );
}
