# ChronoDevice

> Sistema de gestión de activos, garantías y mantenimiento para empresas.
> **El historial clínico de los activos de tu empresa.**

## Descripción

ChronoDevice permite a una empresa tener control total sobre sus equipos físicos: computadores, impresoras, celulares, routers, cámaras, herramientas, aires acondicionados, maquinaria y otros activos.

Cada activo tiene un historial completo de su ciclo de vida:

```text
Compra → Registro → Asignación de responsable → Uso → Mantenimientos
       → Reparaciones → Garantía → Costos acumulados → Retiro o reemplazo
```

## Características

- 🏢 **Multi-empresa (multi-tenant):** cada empresa opera en un espacio aislado; la información de una nunca es visible para otra.
- 🖥️ **Gestión de activos:** registro con categoría, marca/modelo, serie, ubicación, proveedor y responsable.
- 🔧 **Mantenimientos y reparaciones:** historial completo con costos, fechas y técnicos.
- 🛡️ **Garantías:** control de vigencia y alertas por vencimiento.
- 📱 **Códigos QR:** etiquetas imprimibles y consulta pública desde el móvil.
- 📎 **Adjuntos:** fotos y documentos por activo.
- 📊 **Dashboard:** estadísticas, costos acumulados y próximos mantenimientos.
- 🔔 **Alertas:** notificaciones por email de garantías por vencer y mantenimientos programados.
- 📤 **Exportes:** CSV del inventario y PDF del historial por activo.
- 🔍 **Búsqueda global** con command palette (Ctrl+K).

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) + TypeScript |
| UI | [Shadcn/ui](https://ui.shadcn.com) + Tailwind CSS + **Chrono UI** (design system propio) |
| Estado / datos | TanStack Query · Zustand · React Hook Form · Zod |
| Base de datos | [Neon](https://neon.tech) Postgres (free tier) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Autenticación | [Better Auth](https://www.better-auth.com) |
| Archivos | Cloudflare R2 |
| QR | `qrcode` (generar) · `html5-qrcode` (escanear) |
| Emails | Resend + Vercel Cron |
| Hosting | Vercel (free tier) |

## Arquitectura

Backend por capas dentro de Next.js:

```text
app/api/route.ts   →  valida entrada (Zod)
       ↓
lib/services/      →  lógica de negocio
       ↓
lib/repositories/  →  acceso a datos (siempre filtra por company_id)
       ↓
lib/db/            →  Drizzle + Neon Postgres
```

**Multi-tenancy:** una sola base de datos compartida. Cada tabla de negocio lleva `company_id` y toda query la filtra con la empresa de la sesión del usuario, garantizando el aislamiento total entre empresas. Postgres Row Level Security se contempla como capa extra opcional.

## Estructura del proyecto

```text
src/
├── app/                  # Páginas y API routes (Next.js App Router)
├── components/           # Componentes UI (Shadcn + propios)
├── lib/
│   ├── auth/             # Better Auth: sesión, roles, permisos
│   ├── db/               # Cliente Drizzle, esquema, migraciones
│   ├── repositories/     # Capa de acceso a datos
│   ├── services/         # Capa de lógica de negocio
│   ├── validators/       # Esquemas Zod compartidos API ↔ formularios
│   └── storage/          # Cliente Cloudflare R2
```

## Requisitos previos

- Node.js 20+
- Cuentas gratuitas: GitHub, Vercel, [Neon](https://console.neon.tech), Cloudflare (R2), Resend

## Puesta en marcha (desarrollo)

```bash
# 1. Clonar e instalar
git clone https://github.com/dzuluaga23/ChronoDevice.git
cd ChronoDevice
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores (ver sección Variables de entorno)

# 3. Generar y aplicar migraciones, y sembrar datos de prueba
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Levantar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de Neon Postgres |
| `BETTER_AUTH_SECRET` | Secreto para firmar sesiones |
| `BETTER_AUTH_URL` | URL base de la app |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | Credenciales de Cloudflare R2 |
| `RESEND_API_KEY` | API key de Resend para emails |

> ⚠️ Nunca subir el archivo `.env` al repositorio. Usar `.env.example` como plantilla.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | Linter |
| `npm run db:generate` | Generar migraciones desde el esquema Drizzle |
| `npm run db:migrate` | Aplicar migraciones a la BD |
| `npm run db:studio` | Abrir Drizzle Studio (explorador de BD) |
| `npm run db:seed` | Datos de prueba |

## Despliegue

La app se despliega en **Vercel** conectando el repositorio de GitHub:

1. Importar el repo en Vercel (plan Hobby, gratis).
2. Configurar las variables de entorno en el dashboard.
3. Cada push a `main` genera un deploy automático.

## Design system — Chrono UI

Identidad de **ficha técnica industrial**: precisión, orden y jerarquía fuerte.

- **Tipografía:** Inter (UI) + JetBrains Mono para códigos, seriales, montos y fechas.
- **Color:** base de neutros cálidos con acento ámbar industrial; modo oscuro incluido.
- **Estados del ciclo de vida:** 🟢 operativo · 🟡 en mantenimiento · 🔴 en reparación · ⚪ retirado · 🔵 garantía activa.
- Componentes firma: tarjeta de activo con QR, timeline de historial, tabla de inventario densa, command palette.

## Roadmap

Ver [`FLUJO.md`](./FLUJO.md) para el plan completo por sprints hasta la publicación.

## Desarrollador

**David Zuluaga Ceballos**

## Licencia

MIT
