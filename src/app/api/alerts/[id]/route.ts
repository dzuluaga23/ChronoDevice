import { handle, jsonOk } from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/session";
import * as alertsService from "@/lib/services/alerts";
import { updateAlertSchema } from "@/lib/validators/alert";

type RouteParams = { params: Promise<{ id: string }> };

export const PATCH = handle(async (request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  alertsService.assertCanManage(ctx);
  const { id } = await params;
  const body = await request.json();
  updateAlertSchema.parse(body); // solo permite status: "descartada"
  const alert = await alertsService.discardAlert(ctx, id);
  return jsonOk(alert);
});
