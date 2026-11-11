import { handle, jsonList, jsonOk } from "@/lib/api/http";
import { requireAuth, requireRole } from "@/lib/auth/session";
import * as lifecycleService from "@/lib/services/lifecycle";
import { createRepairSchema } from "@/lib/validators/lifecycle";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = handle(async (_request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  const { id } = await params;
  const items = await lifecycleService.listRepairs(ctx, id);
  return jsonList(items, items.length);
});

export const POST = handle(async (request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  requireRole(ctx, ["admin", "tecnico"]);
  const { id } = await params;
  const input = createRepairSchema.parse(await request.json());
  const row = await lifecycleService.createRepair(ctx, id, input);
  return jsonOk(row, 201);
});
