import { requireAuthOrRedirect } from "@/lib/auth/rsc";
import CatalogManager from "@/components/catalog-manager";

export const metadata = { title: "Catálogos" };
// Página privada: lee sesión en cada request.
export const instant = false;

export default async function CatalogosPage() {
  await requireAuthOrRedirect();
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catálogos</h1>
        <p className="text-sm text-muted-foreground">
          Datos maestros de tu empresa: los usan los formularios de activos.
        </p>
      </div>
      <CatalogManager />
    </div>
  );
}
