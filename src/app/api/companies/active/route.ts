import { z } from "zod";
import { handle, jsonOk } from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/session";
import * as companiesService from "@/lib/services/companies";

const setActiveSchema = z.object({
  companyId: z.uuid(),
});

export const POST = handle(async (request: Request) => {
  const ctx = await requireAuth();
  const body = await request.json();
  const input = setActiveSchema.parse(body);
  await companiesService.setActiveCompany(ctx, input.companyId);
  return jsonOk({ activeCompanyId: input.companyId });
});
