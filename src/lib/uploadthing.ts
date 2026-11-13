/**
 * FileRouter de UploadThing — fotos y documentos por activo.
 * El middleware exige sesión + empresa activa y valida que el activo
 * pertenezca a esa empresa (regla multi-tenant también en uploads).
 */
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { UploadThingError } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, attachments, memberships } from "@/lib/db/schema";

const f = createUploadthing();

export const UTFileRouter = {
  assetFiles: f(
    {
      image: { maxFileSize: "8MB", maxFileCount: 10 },
      pdf: { maxFileSize: "8MB", maxFileCount: 10 },
    },
  )
    .input(z.object({ assetId: z.string().uuid() }))
    .middleware(async ({ req, input }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session) {
        throw new UploadThingError("Inicia sesión para subir archivos");
      }

      const [membership] = await db
        .select({ companyId: memberships.companyId })
        .from(memberships)
        .where(eq(memberships.userId, session.user.id))
        .limit(1);
      if (!membership) {
        throw new UploadThingError("Crea una empresa primero");
      }

      const assetId = input.assetId;

      const [asset] = await db
        .select({ id: assets.id })
        .from(assets)
        .where(
          and(
            eq(assets.companyId, membership.companyId),
            eq(assets.id, assetId),
          ),
        )
        .limit(1);
      if (!asset) {
        throw new UploadThingError("Activo no encontrado");
      }

      return {
        companyId: membership.companyId,
        assetId,
        userId: session.user.id,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const kind = file.type.startsWith("image/") ? "foto" : "documento";
      const [row] = await db
        .insert(attachments)
        .values({
          companyId: metadata.companyId,
          assetId: metadata.assetId,
          kind,
          fileName: file.name,
          fileKey: file.key,
          fileUrl: file.ufsUrl ?? file.url,
          mimeType: file.type,
          sizeBytes: file.size,
        })
        .returning();
      return { attachmentId: row.id };
    }),
} satisfies FileRouter;

export type UTAssetFiles = typeof UTFileRouter.assetFiles;
