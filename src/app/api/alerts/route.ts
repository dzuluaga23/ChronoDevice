import { handle, jsonList } from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/session";
import * as alertsService from "@/lib/services/alerts";

export const GET = handle(async () => {
  const ctx = await requireAuth();
  const items = await alertsService.listAlerts(ctx);
  return jsonList(items, items.length);
});
