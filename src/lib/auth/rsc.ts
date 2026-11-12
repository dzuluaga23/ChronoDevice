/**
 * Guardas de sesión para Server Components (a diferencia de requireAuth,
 * que lanza HttpError para la API, aquí hacemos redirect).
 */
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, memberships } from "@/lib/db/schema";
import type { AuthContext } from "@/lib/auth/session";
import type { MemberRole } from "@/lib/auth/session";

/**
 * Exige sesión + empresa activa para una página; si falta sesión va a
 * /login y si el usuario no tiene empresa va a /crear-empresa.
 */
export async function requireAuthOrRedirect(): Promise<AuthContext> {
  // El shell de la app depende de la sesión (cookies): nunca prerrenderizar.
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const rows = await db
    .select({
      companyId: companies.id,
      companyName: companies.name,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(companies, eq(companies.id, memberships.companyId))
    .where(eq(memberships.userId, session.user.id));

  if (rows.length === 0) redirect("/crear-empresa");

  const active =
    rows.find((r) => r.companyId === session.session.activeCompanyId) ??
    rows[0];

  return {
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    companyId: active.companyId,
    companyName: active.companyName,
    role: active.role as MemberRole,
  };
}

/**
 * Para /crear-empresa: exige sesión y redirige a /activos si el usuario
 * ya tiene empresa.
 */
export async function redirectIfHasCompany(): Promise<void> {
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  if (membership) redirect("/activos");
}

/** Para login/registro: si ya hay sesión, va a la app. */
export async function redirectIfAuthenticated(): Promise<void> {
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  redirect(membership ? "/activos" : "/crear-empresa");
}
