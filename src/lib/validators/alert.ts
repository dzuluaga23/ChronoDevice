import { z } from "zod";

/** Única acción sobre una alerta: descartarla. */
export const updateAlertSchema = z.object({
  status: z.literal("descartada"),
});
