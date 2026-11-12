import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireAuthOrRedirect } from "@/lib/auth/rsc";
import * as assetsService from "@/lib/services/assets";
import AssetForm from "@/components/forms/asset-form";

export const metadata = { title: "Editar activo" };
// Página privada: lee sesión/DB en cada request.
export const instant = false;

export default async function EditarActivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuthOrRedirect();
  const { id } = await params;

  // La API devuelve el activo con nombres de catálogo; para el formulario
  // necesitamos la fila cruda (IDs y valores).
  let asset: Awaited<
    ReturnType<typeof assetsService.getAsset>
  > | null = null;
  try {
    asset = await assetsService.getAsset(ctx, id);
  } catch {
    notFound();
  }
  if (!asset) notFound();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={`/activos/${asset.id}`}>
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Editar {asset.code}
          </h1>
          <p className="text-sm text-muted-foreground">{asset.name}</p>
        </div>
      </div>
      <AssetForm mode="edit" initial={asset as never} />
    </div>
  );
}
