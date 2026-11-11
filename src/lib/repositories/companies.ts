/**
 * Repositorio de empresas y membresías.
 */
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, memberships } from "@/lib/db/schema";

export async function listUserCompanies(userId: string) {
  return db
    .select({
      id: companies.id,
      name: companies.name,
      slug: companies.slug,
      role: memberships.role,
      createdAt: companies.createdAt,
    })
    .from(memberships)
    .innerJoin(companies, eq(companies.id, memberships.companyId))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(companies.createdAt));
}

export async function getCompanyBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getCompanyById(companyId: string) {
  const [row] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  return row ?? null;
}

export async function insertCompany(name: string, slug: string) {
  const [company] = await db
    .insert(companies)
    .values({ name, slug })
    .returning();
  return company;
}

export async function insertMembership(
  userId: string,
  companyId: string,
  role: "admin" | "tecnico" | "consulta" = "admin",
) {
  const [membership] = await db
    .insert(memberships)
    .values({ userId, companyId, role })
    .returning();
  return membership;
}

export async function getMembership(userId: string, companyId: string) {
  const [row] = await db
    .select()
    .from(memberships)
    .where(
      and(eq(memberships.userId, userId), eq(memberships.companyId, companyId)),
    )
    .limit(1);
  return row ?? null;
}

/** Lista los miembros de una empresa (con datos de usuario de auth). */
export async function listCompanyMembers(companyId: string) {
  return db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      role: memberships.role,
      createdAt: memberships.createdAt,
    })
    .from(memberships)
    .where(eq(memberships.companyId, companyId))
    .orderBy(asc(memberships.createdAt));
}
