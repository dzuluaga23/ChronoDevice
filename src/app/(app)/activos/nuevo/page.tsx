import { requireAuthOrRedirect } from "@/lib/auth/rsc";
import AssetForm from "@/components/forms/asset-form";

export const metadata = { title: "Nuevo activo" };
// Página privada: lee sesión en cada request.
export const instant = false;

export default async function NuevoActivoPage() {
  await requireAuthOrRedirect();
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo activo</h1>
        <p className="text-sm text-muted-foreground">
          El código se genera automáticamente al guardar (AST-####).
        </p>
      </div>
      <AssetForm mode="create" />
    </div>
  );
}
