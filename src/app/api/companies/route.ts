import { z } from "zod";
import { jsonOk, handle } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import * as companiesService from "@/lib/services/companies";

const createCompanySchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
});

export const GET = handle(async () => {
  const user = await requireSessionUser();
  const companies = await companiesService.listUserCompanies(user.userId);
  return jsonOk(companies);
});

export const POST = handle(async (request: Request) => {
  const user = await requireSessionUser();
  const body = await request.json();
  const input = createCompanySchema.parse(body);
  const ctx = {
    userId: user.userId,
    userName: user.userName,
    userEmail: user.userEmail,
    companyId: "",
    companyName: "",
    role: "admin" as const,
  };
  const company = await companiesService.createCompany(ctx, input.name);
  // La nueva empresa queda activa en la sesión
  await companiesService.setActiveCompany(
    { ...ctx, companyId: company.id },
    company.id,
  );
  return jsonOk(company, 201);
});
