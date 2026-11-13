import { handle, jsonList } from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/session";
import { globalSearch } from "@/lib/services/search";

export const GET = handle(async (request: Request) => {
  const ctx = await requireAuth();
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const results = await globalSearch(ctx.companyId, q);
  return jsonList(results, results.length);
});
