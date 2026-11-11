/**
 * Validadores Zod de assets — compartidos entre la API y los
 * formularios del frontend (una sola definición de "cómo es un activo").
 */
import { z } from "zod";

export const assetStatusValues = [
  "operativo",
  "en_mantenimiento",
  "en_reparacion",
  "retirado",
] as const;

/** Dinero: hasta 2 decimales, sin signo. */
export const moneySchema = z
  .string()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, "Formato de dinero inválido (ej: 1234.50)");

export const createAssetSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  categoryId: z.uuid().nullish(),
  brandId: z.uuid().nullish(),
  model: z.string().trim().max(120).nullish(),
  serialNumber: z.string().trim().max(120).nullish(),
  status: z.enum(assetStatusValues).default("operativo"),
  locationId: z.uuid().nullish(),
  supplierId: z.uuid().nullish(),
  responsibleUserId: z.string().max(64).nullish(),
  purchaseDate: z.coerce.date().nullish(),
  purchasePrice: moneySchema.nullish(),
  notes: z.string().trim().max(2000).nullish(),
});

export const updateAssetSchema = createAssetSchema.partial();

export const assetQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(assetStatusValues).optional(),
  categoryId: z.uuid().optional(),
  locationId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AssetQueryInput = z.infer<typeof assetQuerySchema>;
