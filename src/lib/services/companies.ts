/**
 * Service de empresas — creación y cambio de empresa activa.
 */
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { session as sessionsTable } from "@/lib/db/auth-schema";
import { badRequest } from "@/lib/api/http";
import type { AuthContext } from "@/lib/auth/session";
import * as companiesRepo from "@/lib/repositories/companies";

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function listUserCompanies(userId: string) {
  return companiesRepo.listUserCompanies(userId);
}

/**
 * Crea una empresa y asigna al usuario como admin.
 * El slug se genera del nombre con sufijo numérico si ya existe.
 */
export async function createCompany(ctx: AuthContext, name: string) {
  const baseSlug = slugify(name) || "empresa";
  let slug = baseSlug;
  let attempt = 1;

  while (await companiesRepo.getCompanyBySlug(slug)) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const company = await companiesRepo.insertCompany(name.trim(), slug);
  await companiesRepo.insertMembership(ctx.userId, company.id, "admin");
  return company;
}

/**
 * Cambia la empresa activa del usuario en su sesión.
 * Solo se permite si el usuario tiene membresía en esa empresa.
 */
export async function setActiveCompany(
  ctx: AuthContext,
  companyId: string,
): Promise<void> {
  const membership = await companiesRepo.getMembership(ctx.userId, companyId);
  if (!membership) {
    throw badRequest("No perteneces a esa empresa");
  }

  const fullSession = await auth.api.getSession({ headers: await headers() });
  if (!fullSession) throw badRequest("Sesión no encontrada");

  await db
    .update(sessionsTable)
    .set({ activeCompanyId: companyId })
    .where(eq(sessionsTable.id, fullSession.session.id));
}
