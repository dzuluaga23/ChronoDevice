/** Historial completo del activo: timeline + costos acumulados. */
import { handle, jsonOk } from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/session";
import * as lifecycleService from "@/lib/services/lifecycle";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = handle(async (_request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  const { id } = await params;
  const history = await lifecycleService.getAssetHistory(ctx, id);
  return jsonOk(history);
});
