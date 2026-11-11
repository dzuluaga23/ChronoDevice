/**
 * Miembros de la empresa activa — lista para asignar responsables
 * a activos. Solo lectura; la gestión de roles vivirá en el Sprint 3.
 */
import { handle, jsonList } from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/session";
import * as companiesRepo from "@/lib/repositories/companies";

export const GET = handle(async () => {
  const ctx = await requireAuth();
  const members = await companiesRepo.listCompanyMembersWithUser(ctx.companyId);
  return jsonList(members, members.length);
});
