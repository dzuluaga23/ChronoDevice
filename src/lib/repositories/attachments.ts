/**
 * Repositorio de adjuntos (fotos y documentos por activo).
 * Toda query filtra por companyId (regla multi-tenant).
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";

export async function listAttachmentsByAsset(
  companyId: string,
  assetId: string,
) {
  return db
    .select({
      id: attachments.id,
      kind: attachments.kind,
      fileName: attachments.fileName,
      fileKey: attachments.fileKey,
      fileUrl: attachments.fileUrl,
      mimeType: attachments.mimeType,
      sizeBytes: attachments.sizeBytes,
      uploadedAt: attachments.uploadedAt,
    })
    .from(attachments)
    .where(
      and(
        eq(attachments.companyId, companyId),
        eq(attachments.assetId, assetId),
      ),
    )
    .orderBy(desc(attachments.uploadedAt));
}

export async function getAttachmentRow(companyId: string, id: string) {
  const [row] = await db
    .select()
    .from(attachments)
    .where(
      and(eq(attachments.companyId, companyId), eq(attachments.id, id)),
    )
    .limit(1);
  return row ?? null;
}

export async function deleteAttachmentRow(companyId: string, id: string) {
  const [row] = await db
    .delete(attachments)
    .where(
      and(eq(attachments.companyId, companyId), eq(attachments.id, id)),
    )
    .returning({ id: attachments.id, fileKey: attachments.fileKey });
  return row ?? null;
}
