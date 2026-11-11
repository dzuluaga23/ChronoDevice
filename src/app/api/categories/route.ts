import { handle, jsonList, jsonOk } from "@/lib/api/http";
import { requireAuth, requireRole } from "@/lib/auth/session";
import * as catalogsService from "@/lib/services/catalogs";
import {
  catalogQuerySchema,
  createCategorySchema,
} from "@/lib/validators/catalog";

export const GET = handle(async (request: Request) => {
  const ctx = await requireAuth();
  const url = new URL(request.url);
  const query = catalogQuerySchema.parse(Object.fromEntries(url.searchParams));
  const items = await catalogsService.listCatalog(ctx, "categories", query.q);
  return jsonList(items, items.length);
});

export const POST = handle(async (request: Request) => {
  const ctx = await requireAuth();
  requireRole(ctx, ["admin", "tecnico"]);
  const input = createCategorySchema.parse(await request.json());
  const row = await catalogsService.createCatalogRow(
    ctx,
    "categories",
    input,
  );
  return jsonOk(row, 201);
});
