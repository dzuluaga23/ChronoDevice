/**
 * Service de búsqueda global (Ctrl+K): busca activos de la empresa
 * por código, nombre, modelo y número de serie.
 */
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";

export interface SearchResult {
  id: string;
  code: string;
  name: string;
  status: string;
  model: string | null;
}

export async function globalSearch(
  companyId: string,
  q: string,
): Promise<SearchResult[]> {
  if (q.length < 2) return [];

  const pattern = `%${q}%`;
  return db
    .select({
      id: assets.id,
      code: assets.code,
      name: assets.name,
      status: assets.status,
      model: assets.model,
    })
    .from(assets)
    .where(
      and(
        eq(assets.companyId, companyId),
        or(
          ilike(assets.code, pattern),
          ilike(assets.name, pattern),
          ilike(assets.model, pattern),
          ilike(assets.serialNumber, pattern),
        ),
      ),
    )
    .orderBy(sql`position(lower(${q}) in lower(${assets.code})) nulls last`, assets.code)
    .limit(8);
}
