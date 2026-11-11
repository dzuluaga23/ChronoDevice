/**
 * Validadores Zod de los catálogos (categorías, marcas, ubicaciones,
 * proveedores) — compartidos entre la API y los formularios del front.
 */
import { z } from "zod";

/** Nombre de catálogo: obligatorio, sin espacios sobrantes. */
export const catalogNameSchema = z
  .string()
  .trim()
  .min(1, "El nombre es obligatorio")
  .max(120);

export const catalogQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
});

export const createCategorySchema = z.object({
  name: catalogNameSchema,
  description: z.string().trim().max(500).nullish(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createBrandSchema = z.object({
  name: catalogNameSchema,
});

export const updateBrandSchema = createBrandSchema.partial();

export const createLocationSchema = z.object({
  name: catalogNameSchema,
  address: z.string().trim().max(300).nullish(),
});

export const updateLocationSchema = createLocationSchema.partial();

export const createSupplierSchema = z.object({
  name: catalogNameSchema,
  contactName: z.string().trim().max(120).nullish(),
  phone: z.string().trim().max(40).nullish(),
  email: z.email("Email inválido").nullish(),
  notes: z.string().trim().max(2000).nullish(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CatalogKind = "categories" | "brands" | "locations" | "suppliers";

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
