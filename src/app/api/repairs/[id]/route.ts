import { handle, jsonOk } from "@/lib/api/http";
import { requireAuth, requireRole } from "@/lib/auth/session";
import * as lifecycleService from "@/lib/services/lifecycle";
import { updateRepairSchema } from "@/lib/validators/lifecycle";

type RouteParams = { params: Promise<{ id: string }> };

export const PATCH = handle(async (request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  requireRole(ctx, ["admin", "tecnico"]);
  const { id } = await params;
  const input = updateRepairSchema.parse(await request.json());
  const row = await lifecycleService.updateRepair(ctx, id, input);
  return jsonOk(row);
});

export const DELETE = handle(async (_request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  requireRole(ctx, ["admin"]);
  const { id } = await params;
  const deleted = await lifecycleService.deleteRepair(ctx, id);
  return jsonOk(deleted);
});
