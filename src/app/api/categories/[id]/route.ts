import { handle, jsonOk } from "@/lib/api/http";
import { requireAuth, requireRole } from "@/lib/auth/session";
import * as catalogsService from "@/lib/services/catalogs";
import { updateCategorySchema } from "@/lib/validators/catalog";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = handle(async (_request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  const { id } = await params;
  const row = await catalogsService.getCatalogRow(ctx, "categories", id);
  return jsonOk(row);
});

export const PATCH = handle(async (request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  requireRole(ctx, ["admin", "tecnico"]);
  const { id } = await params;
  const input = updateCategorySchema.parse(await request.json());
  const row = await catalogsService.updateCatalogRow(ctx, "categories", id, input);
  return jsonOk(row);
});

export const DELETE = handle(async (_request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  requireRole(ctx, ["admin"]);
  const { id } = await params;
  await catalogsService.deleteCatalogRow(ctx, "categories", id);
  return jsonOk({ deleted: true });
});
