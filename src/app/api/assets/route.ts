import { handle, jsonList, jsonOk } from "@/lib/api/http";
import { requireAuth, requireRole } from "@/lib/auth/session";
import * as assetsService from "@/lib/services/assets";
import {
  assetQuerySchema,
  createAssetSchema,
} from "@/lib/validators/asset";

export const GET = handle(async (request: Request) => {
  const ctx = await requireAuth();
  const url = new URL(request.url);
  const query = assetQuerySchema.parse(Object.fromEntries(url.searchParams));
  const { items, total } = await assetsService.listAssets(ctx.companyId, query);
  return jsonList(items, total);
});

export const POST = handle(async (request: Request) => {
  const ctx = await requireAuth();
  requireRole(ctx, ["admin", "tecnico"]);
  const body = await request.json();
  const input = createAssetSchema.parse(body);
  const asset = await assetsService.createAsset(ctx, input);
  return jsonOk(asset, 201);
});
