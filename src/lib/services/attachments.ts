/**
 * Service de adjuntos: lista y borra fotos/documentos de un activo.
 * Al borrar también elimina el archivo del storage (UploadThing).
 */
import { notFound } from "@/lib/api/http";
import type { AuthContext } from "@/lib/auth/session";
import * as attachmentsRepo from "@/lib/repositories/attachments";
import * as assetsService from "@/lib/services/assets";

export async function listAttachments(ctx: AuthContext, assetId: string) {
  await assetsService.assertAssetExists(ctx.companyId, assetId);
  return attachmentsRepo.listAttachmentsByAsset(ctx.companyId, assetId);
}

export async function deleteAttachment(ctx: AuthContext, id: string) {
  const row = await attachmentsRepo.deleteAttachmentRow(ctx.companyId, id);
  if (!row) throw notFound("Archivo no encontrado");

  // Borra el archivo en UploadThing; si falla, el row ya no existe y
  // el archivo queda huérfano — aceptable para el MVP.
  try {
    const { UTApi } = await import("uploadthing/server");
    await new UTApi().deleteFiles(row.fileKey);
  } catch {
    // Sin token configurado o error transitorio: no bloquea el borrado.
  }
  return row;
}
