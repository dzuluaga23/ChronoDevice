# FLUJO — Plan de desarrollo ChronoDevice

> Ruta de desarrollo por sprints: **BD → Backend → Frontend → Publicación**.
> Marca cada ítem con `[x]` cuando esté completado.

---

## Sprint 0 — Cimientos

- [x] Crear repo en GitHub y conectarlo al directorio local
- [x] Crear cuenta en Neon (Postgres gratis) y obtener connection string
- [ ] Crear cuenta en Vercel (con GitHub)
- [x] Scaffolding de Next.js (App Router) + TypeScript + Tailwind + ESLint
- [x] Instalar Shadcn/ui y componentes base
- [x] Definir design tokens de **Chrono UI** (colores, tipografía, espaciados, estados)
- [ ] Primer deploy a Vercel (app "hola mundo" publicada)
- [ ] Variables de entorno configuradas localmente y en Vercel

## Sprint 1 — Base de datos

- [x] Configurar Drizzle ORM + conexión a Neon
- [x] Esquema: `companies`, `users`, `memberships` (usuario↔empresa + rol)
- [x] Esquema: `assets` (activo) + `categories`, `locations`, `suppliers`
- [x] Esquema: `maintenances`, `repairs`, `warranties`
- [x] Esquema: `attachments` (fotos/documentos), `alerts`
- [x] Regla multi-tenant: `company_id` en todas las tablas de negocio
- [x] Migraciones generadas y aplicadas en Neon
- [x] Seed de datos de prueba
- [ ] Diagrama entidad-relación documentado

## Sprint 2 — Backend

- [x] Better Auth: registro, login, sesión
- [x] Flujo multi-empresa: crear empresa / roles (admin, técnico, consulta) *(invitaciones por email pendientes)*
- [x] Arquitectura por capas: `route → service → repository → Drizzle`
- [x] Repositories con filtro automático por `company_id`
- [x] Endpoints CRUD: activos (con código automático AST-#### y filtros)
- [x] Endpoints CRUD: categorías, marcas, ubicaciones, proveedores, responsables
- [x] Endpoints: mantenimientos, reparaciones, garantías, costos acumulados (historial por activo)
- [x] Validación con Zod en todos los endpoints (esquemas compartidos con el front)
- [x] Manejo de errores y respuestas consistentes

## Sprint 3 — Front CRUD

- [x] Layout de la aplicación (sidebar, topbar móvil, área de trabajo)
- [x] Páginas de login / registro / crear empresa *(formularios nativos + fetch; RHF pendiente si se desea)*
- [x] CRUD de activos con formularios (crear + editar, catálogos y responsables en selects)
- [x] Tabla de inventario densa con filtros, búsqueda y estados de ciclo de vida
- [x] CRUD de catálogos (categorías, ubicaciones, proveedores, marcas) en pestañas
- [x] Página de detalle de activo con timeline del historial + costos acumulados

## Sprint 4 — Ciclo de vida

- [x] Registro de mantenimientos (realizados y programados)
- [x] Registro de reparaciones con costos
- [x] Gestión de garantías (inicio, fin, estado activa/vencida)
- [x] Cálculo de costos acumulados por activo
- [x] Vista "próximos mantenimientos" con orden por fecha
- [x] Cambio de estado del activo según su ciclo de vida

## Sprint 5 — QR y adjuntos

- [x] Generación de códigos QR por activo (`qrcode`)
- [x] Etiqueta imprimible (QR + código + nombre + empresa)
- [x] Página pública de consulta por QR (sin login, datos no sensibles)
- [x] Escaneo desde cámara móvil (`html5-qrcode`)
- [ ] Cloudflare R2: bucket y configuración
- [ ] Subida de fotos y documentos (múltiples, con progreso)
- [ ] Vista de galería de adjuntos en el detalle del activo

## Sprint 6 — Dashboard y alertas

- [ ] Dashboard con estadísticas (KPIs: activos, costos, garantías por vencer)
- [ ] Gráficas con Recharts (activos por categoría, costos por mes, estados)
- [ ] Búsqueda global con command palette (Ctrl+K)
- [ ] Resend: envío de emails
- [ ] Vercel Cron: revisión diaria de garantías por vencer y mantenimientos programados
- [ ] Centro de alertas dentro de la app
- [ ] Exportes: CSV del inventario y PDF del historial de un activo

## Sprint 7 — Publicación

- [ ] Pulido de UI y responsive
- [ ] Seguridad: página pública protegida contra enumeración de IDs
- [ ] Verificación de reglas multi-tenant (auditoría de queries)
- [ ] README completo y capturas
- [ ] Dominio configurado (opcional)
- [ ] 🚀 **Publicado**

---

## Decisiones técnicas

| Tema | Decisión | Motivo |
|---|---|---|
| Framework | Next.js (App Router) full-stack | Un solo repo y deploy; API Routes reemplazan a Hono |
| Arquitectura backend | Por capas (route → service → repository) | Testable sin la ceremonia de Clean Architecture |
| Multi-tenancy | Una BD compartida, aislamiento por `company_id` + RLS opcional | Simple, barato y escalable |
| Docker | Descartado | Innecesario con Vercel + Neon |
| Hono | Descartado (migración futura posible) | Next API Routes cubren la necesidad |

## Cuentas gratuitas necesarias

| Servicio | Uso | Registro |
|---|---|---|
| GitHub | Repositorio y CI | github.com |
| Vercel | Hosting + funciones + cron | vercel.com (con GitHub) |
| Neon | Postgres gratis (1 GB, sin tarjeta) | console.neon.tech |
| Cloudflare R2 | Almacenamiento de archivos (10 GB) | dash.cloudflare.com |
| Resend | Emails de alerta (3.000/mes) | resend.com |
