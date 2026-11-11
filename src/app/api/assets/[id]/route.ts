import { handle, jsonOk } from "@/lib/api/http";
import { requireAuth, requireRole } from "@/lib/auth/session";
import * as assetsService from "@/lib/services/assets";
import { updateAssetSchema } from "@/lib/validators/asset";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = handle(async (_request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  const { id } = await params;
  const asset = await assetsService.getAsset(ctx, id);
  return jsonOk(asset);
});

export const PATCH = handle(async (request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  requireRole(ctx, ["admin", "tecnico"]);
  const { id } = await params;
  const body = await request.json();
  const input = updateAssetSchema.parse(body);
  const asset = await assetsService.updateAsset(ctx, id, input);
  return jsonOk(asset);
});

export const DELETE = handle(async (_request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  requireRole(ctx, ["admin"]);
  const { id } = await params;
  const deleted = await assetsService.deleteAsset(ctx, id);
  return jsonOk(deleted);
});
