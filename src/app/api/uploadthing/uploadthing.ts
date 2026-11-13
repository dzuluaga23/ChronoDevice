import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import type { UTFileRouter } from "@/lib/uploadthing";

/**
 * Componentes de subida tipados con nuestro FileRouter.
 * Se importan desde el cliente: usa assetFiles con input { assetId }.
 */
export const UploadButton = generateUploadButton<typeof UTFileRouter>();
export const UploadDropzone = generateUploadDropzone<typeof UTFileRouter>();
