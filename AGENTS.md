<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ChronoDevice — agent notes

Gestión de activos/mantenimiento multi-tenant. Stack: Next.js 16 (App Router, Turbopack) + Drizzle + Neon Postgres + Better Auth. Plan de sprints y decisiones: `FLUJO.md`; setup: `README.md`.

## Commands

```powershell
npm run dev          # dev server (Turbopack) en :3000
npm run build        # build de producción; TAMBIÉN es el typecheck (no hay test suite aún)
npm run lint         # ESLint CLI (next lint ya no existe en Next 16)

npm run db:generate  # tras editar src/lib/db/*.ts → genera migración
npm run db:migrate   # aplica migraciones a Neon
npm run db:seed      # siembra empresa DemoCorp (idempotente)
```

- **Nunca usar `drizzle-kit push`**: en 0.31.11 reporta constraints únicas inexistentes y pide truncar tablas. Solo flujo de migraciones (`generate` → `migrate`).
- Verificación de API: no hay tests automatizados. Levantar `npm run dev` y probar endpoints con `Invoke-RestMethod -SessionVariable s` (el `-SessionVariable`/`-WebSession` no sobrevive entre comandos de PowerShell: hacer todo el flujo en un solo comando).

## Environment

- `.env.local` (no commiteado): `DATABASE_URL` (Neon, string con pooler), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Plantilla: `.env.example`.
- Scripts Node independientes (ej. seed) deben ejecutar `dotenv.config({ path: ".env.local" })` **antes** de importar `src/lib/db` — los imports estáticos se hoistean y el Pool se crearía sin URL ("client password must be a string").
- Los builds lean `.env.local` automáticamente (Next lo carga).

## Multi-tenancy (regla dura)

- Toda tabla de negocio lleva `companyId` y toda query del repository **filtra por la empresa de la sesión**. Un activo de la Empresa A nunca debe ser visible/editable por la Empresa B.
- Los services validan que referencias cruzadas (categoría, marca, ubicación, proveedor) pertenezcan a la misma empresa (`validateRefs` en `src/lib/services/assets.ts`).
- Tablas nuevas de negocio deben seguir el patrón; crear seed correspondiente.

## Backend por capas

`src/app/api/**/route.ts` (delgada: parse Zod + auth + llamar service) → `src/lib/services/` (reglas de negocio) → `src/lib/repositories/` (únicas queries Drizzle) → `src/lib/db/`.

- Validadores Zod en `src/lib/validators/` — compartidos entre API y formularios del front; no duplicar reglas.
- Errores: lanzar `HttpError` (helpers en `src/lib/api/http.ts`); los handlers van envueltos en `handle()` que mapea `HttpError`/`ZodError` a respuestas JSON consistentes.
- Códigos de activo autogenerados por empresa: `nextAssetCode` → `AST-0001`, `AST-0002`, ... (requiere ordenar alfabéticamente, no cambiar el formato sin migrar datos).

## Better Auth (1.7.x) — quirks

- `src/lib/db/auth-schema.ts` se mantiene **a mano**: el CLI `@better-auth/cli generate` mete columnas basura (`0: text("0")`) y descarta los campos adicionales.
- `additionalFields` es un mapa `{ nombreCampo: { type, required, returned, input } }` — el nombre del campo es la key del objeto, no hay propiedad `key`.
- `nextCookies()` debe ser **siempre el último** plugin.
- El cliente DB (`src/lib/db/index.ts`) debe mergear ambos esquemas (`{ ...schema, ...authSchema }`) o el drizzleAdapter falla con "Missing tables user, session...".
- `requireSessionUser()` (solo sesión) ≠ `requireAuth()` (sesión + empresa activa). Un usuario recién registrado no tiene empresa: si `requireAuth` le exige membresía, no podría crear su primera empresa. Cuando no hay membresía, `requireAuth` lanza `403 { code: "no_company" }` para que el front redirija a crear empresa.
- Sesión con campo `activeCompanyId`: cambiar empresa activa = `UPDATE session SET active_company_id` en `src/lib/services/companies.ts`.

## Base de datos

- Migraciones commiteadas en `src/lib/db/migrations` (snapshot en `meta/`). Tras cambiar esquema: `db:generate` → revisar SQL → `db:migrate`.
- Reset de BD de desarrollo (los datos son seed desechable): `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` y luego `db:migrate` + `db:seed`.

## Next.js 16 — gotchas

- `params`/`searchParams`/`cookies()`/`headers()` son **async** (Promise). En route handlers dinámicos: `type RouteParams = { params: Promise<{ id: string }> }`.
- Route handlers no se cachean por defecto; `middleware` se llama `proxy.ts`.
- `next build` ya no corre lint ni valida por sí solo el ESLint.
