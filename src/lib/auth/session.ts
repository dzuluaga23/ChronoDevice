/**
 * Contexto de sesión: usuario autenticado + empresa activa + rol.
 * La empresa activa vive en la sesión de Better Auth; si no está
 * definida, se usa la primera membresía del usuario.
 */
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, memberships } from "@/lib/db/schema";
import { forbidden, HttpError, unauthorized } from "@/lib/api/http";

export type MemberRole = "admin" | "tecnico" | "consulta";

export interface AuthContext {
  userId: string;
  userName: string;
  userEmail: string;
  companyId: string;
  companyName: string;
  role: MemberRole;
}

/** Devuelve el contexto de auth o null si no hay sesión. */
export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const rows = await db
    .select({
      companyId: companies.id,
      companyName: companies.name,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(companies, eq(companies.id, memberships.companyId))
    .where(eq(memberships.userId, session.user.id));

  if (rows.length === 0) return null;

  const active =
    rows.find((r) => r.companyId === session.session.activeCompanyId) ?? rows[0];

  return {
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    companyId: active.companyId,
    companyName: active.companyName,
    role: active.role,
  };
}

interface SessionUser {
  userId: string;
  userName: string;
  userEmail: string;
}

/** Devuelve solo el usuario de la sesión (sin exigir empresa) o null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return {
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
  };
}

/** Exige sesión válida (aunque el usuario aún no tenga empresa). */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw unauthorized();
  return user;
}

/** Igual que getAuthContext, pero lanza si no hay sesión o empresa. */
export async function requireAuth(): Promise<AuthContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw unauthorized();

  const rows = await db
    .select({
      companyId: companies.id,
      companyName: companies.name,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(companies, eq(companies.id, memberships.companyId))
    .where(eq(memberships.userId, session.user.id));

  if (rows.length === 0) {
    // 403 con código específico: el front lo redirige a "crear empresa"
    throw new HttpError(
      403,
      "no_company",
      "Crea una empresa para continuar",
    );
  }

  const active =
    rows.find((r) => r.companyId === session.session.activeCompanyId) ?? rows[0];

  return {
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    companyId: active.companyId,
    companyName: active.companyName,
    role: active.role,
  };
}

/** Exige uno de los roles indicados para la operación. */
export function requireRole(
  ctx: AuthContext,
  roles: MemberRole[],
): void {
  if (!roles.includes(ctx.role)) {
    throw forbidden(
      `Tu rol (${ctx.role}) no permite esta operación. Requiere: ${roles.join(", ")}.`,
    );
  }
}

/** Verifica que un usuario pertenece a una empresa y retorna su rol. */
export async function getMembershipRole(
  userId: string,
  companyId: string,
): Promise<MemberRole | null> {
  const [row] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(eq(memberships.userId, userId), eq(memberships.companyId, companyId)),
    )
    .limit(1);
  return row?.role ?? null;
}
