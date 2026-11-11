/**
 * Validadores Zod del ciclo de vida del activo:
 * mantenimientos, reparaciones y garantías.
 */
import { z } from "zod";
import { moneySchema } from "./asset";

export const maintenanceTypeValues = [
  "preventivo",
  "correctivo",
  "otros",
] as const;

export const createMaintenanceSchema = z.object({
  type: z.enum(maintenanceTypeValues).default("preventivo"),
  performedAt: z.coerce.date().default(() => new Date()),
  nextAt: z.coerce.date().nullish(),
  description: z.string().trim().min(1, "La descripción es obligatoria").max(2000),
  cost: moneySchema.nullish(),
  technician: z.string().trim().max(120).nullish(),
});

export const updateMaintenanceSchema = createMaintenanceSchema.partial();

export const createRepairSchema = z.object({
  failureDescription: z
    .string()
    .trim()
    .min(1, "Describe la falla")
    .max(2000),
  solution: z.string().trim().max(2000).nullish(),
  repairedAt: z.coerce.date().default(() => new Date()),
  cost: moneySchema.nullish(),
  technician: z.string().trim().max(120).nullish(),
});

export const updateRepairSchema = createRepairSchema.partial();

export const warrantyFieldsSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  provider: z.string().trim().max(120).nullish(),
  coverageNotes: z.string().trim().max(2000).nullish(),
});

export const createWarrantySchema = warrantyFieldsSchema.refine(
  (w) => w.endDate > w.startDate,
  {
    message: "La fecha de fin debe ser posterior a la de inicio",
    path: ["endDate"],
  },
);

export const updateWarrantySchema = warrantyFieldsSchema.partial();

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type CreateRepairInput = z.infer<typeof createRepairSchema>;
export type UpdateRepairInput = z.infer<typeof updateRepairSchema>;
export type CreateWarrantyInput = z.infer<typeof createWarrantySchema>;
export type UpdateWarrantyInput = z.infer<typeof updateWarrantySchema>;
