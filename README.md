# ChronoDevice

> Sistema de gestión de activos, garantías y mantenimiento para empresas.
> **El historial clínico de los activos de tu empresa.**

**🚀 App en producción: [https://chrono-device.vercel.app](https://chrono-device.vercel.app)**

## Descripción

ChronoDevice permite a una empresa tener control total sobre sus equipos físicos: computadores, impresoras, celulares, routers, cámaras, herramientas, aires acondicionados, maquinaria y otros activos.

Cada activo tiene un historial completo de su ciclo de vida:

```text
Compra → Registro → Asignación de responsable → Uso → Mantenimientos
       → Reparaciones → Garantía → Costos acumulados → Retiro o reemplazo
```

## Características

- 🏢 **Multi-empresa (multi-tenant):** cada empresa opera en un espacio aislado; la información de una nunca es visible para otra.
- 🖥️ **Inventario de activos:** registro con categoría, marca/modelo, serie, ubicación, proveedor y responsable.
- 🔧 **Mantenimientos y reparaciones:** historial completo con costos, fechas y técnicos; el estado del activo cambia automáticamente.
- 🛡️ **Garantías:** control de vigencia (activa / vencida) con proveedor y notas de cobertura.
- 📱 **Códigos QR:** etiquetas imprimibles, escaneo con la cámara del celular y consulta pública (sin login, sin datos sensibles).
- 📎 **Adjuntos:** fotos y documentos por activo (hasta 8 MB, imagen y PDF).
- 📊 **Dashboard:** KPIs (activos, estados, inversión acumulada, garantías) + gráficas de costos por mes y activos por categoría.
- 🔔 **Centro de alertas:** garantías por vencer (≤30 días), vencidas y mantenimientos programados (≤7 días); correo-resumen opcional vía Resend.
- ⏰ **Cron diario** (Vercel Cron): revisa todas las empresas y genera las alertas automáticamente.
- 🔍 **Búsqueda global** con command palette (Ctrl+K): código, nombre, modelo o serie.
- 📤 **Exportes:** CSV del inventario y PDF del historial por activo (con previsualización en el navegador).

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) + TypeScript |
| UI | [Shadcn/ui](https://ui.shadcn.com) + Tailwind CSS 4 + **Chrono UI** (design system propio) |
| Gráficas | [Recharts](https://recharts.org) |
| Validación | [Zod](https://zod.dev) (esquemas compartidos API ↔ formularios) |
| Base de datos | [Neon](https://neon.tech) Postgres (free tier, sin tarjeta) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Autenticación | [Better Auth](https://www.better-auth.com) (sesión por cookie httpOnly) |
| Archivos | [UploadThing](https://uploadthing.com) (free tier, sin tarjeta) |
| QR | `qrcode` (generar) · `html5-qrcode` (escanear) |
| PDF | `jspdf` + `jspdf-autotable` (generado en el navegador) |
| Emails | [Resend](https://resend.com) (opcional) |
| Cron | [Vercel Cron](https://vercel.com/docs/cron-jobs) (1 vez/día, plan Hobby) |
| Hosting | [Vercel](https://vercel.com) (free tier) |

Todo el stack corre en capas gratuitas y **sin tarjeta de crédito**.

## Arquitectura

Backend por capas dentro de Next.js:

```text
app/api/route.ts   →  valida entrada (Zod) + sesión
        ↓
lib/services/      →  lógica de negocio
        ↓
lib/repositories/  →  acceso a datos (siempre filtra por company_id)
        ↓
lib/db/            →  Drizzle + Neon Postgres
```

**Multi-tenancy:** una sola base de datos compartida. Cada tabla de negocio lleva `company_id` y toda query la filtra con la empresa de la sesión del usuario, garantizando el aislamiento total entre empresas.

## Estructura del proyecto

```text
src/
├── app/                  # Páginas y API routes (Next.js App Router)
│   ├── (app)/            # Shell privado (dashboard, activos, alertas, ...)
│   ├── q/[id]/           # Ficha pública por QR (sin login)
│   └── api/              # Endpoints REST + cron diario
├── components/           # Componentes UI (Shadcn + propios)
├── lib/
│   ├── auth/             # Better Auth: sesión, roles, guardas RSC
│   ├── db/               # Cliente Drizzle, esquema, migraciones
│   ├── repositories/     # Capa de acceso a datos
│   ├── services/         # Capa de lógica de negocio
│   ├── validators/       # Esquemas Zod compartidos API ↔ formularios
│   └── uploadthing.ts    # FileRouter de adjuntos
└── proxy.ts              # Headers no-store en rutas privadas
```

## Requisitos previos

- Node.js 20+
- Cuentas gratuitas: [GitHub](https://github.com), [Vercel](https://vercel.com), [Neon](https://console.neon.tech), [UploadThing](https://uploadthing.com) · [Resend](https://resend.com) (opcional, para emails)

## Puesta en marcha (desarrollo)

```bash
# 1. Clonar e instalar
git clone https://github.com/dzuluaga23/ChronoDevice.git
cd ChronoDevice
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores (ver sección Variables de entorno)

# 3. Aplicar migraciones y sembrar datos de prueba
npm run db:migrate
npm run db:seed

# 4. Levantar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

> Las migraciones ya están committeadas en `src/lib/db/migrations`; solo necesitas `db:migrate`. Usa `db:generate` únicamente si modificas el esquema (`src/lib/db/schema.ts`).

## Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string de Neon Postgres (con pooler) |
| `BETTER_AUTH_SECRET` | ✅ | Secreto para firmar sesiones (32+ caracteres) |
| `BETTER_AUTH_URL` | ✅ | URL base de la app (`http://localhost:3000` en dev) |
| `UPLOADTHING_TOKEN` | ✅ | Token del dashboard de UploadThing (adjuntos) |
| `CRON_SECRET` | ✅* | Secreto del cron; Vercel lo envía como `Authorization: Bearer` |
| `RESEND_API_KEY` | opcional | API key de Resend para el correo-resumen de alertas |
| `RESEND_FROM` | opcional | Remitente (`"ChronoDevice <alerts@tudominio.com>"`) |

\* Solo si se usa el cron; en local puede omitirse (el endpoint quedará protegido).

> ⚠️ Nunca subir `.env.local` al repositorio. `.env.example` es la plantilla.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción (también hace el typecheck) |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generar migraciones desde el esquema Drizzle |
| `npm run db:migrate` | Aplicar migraciones a la BD |
| `npm run db:studio` | Abrir Drizzle Studio (explorador de BD) |
| `npm run db:seed` | Datos de prueba (DemoCorp, idempotente) |

## Despliegue (Vercel + Neon, todo gratis)

1. **Neon:** crea un proyecto nuevo → copia el connection string (pooled).
2. **Aplica las migraciones** a esa BD: `DATABASE_URL="<cadena>" npm run db:migrate`.
3. **Vercel:** importa el repo de GitHub (plan Hobby, sin tarjeta) y configura las variables de entorno de la tabla anterior.
4. **Redeploy** después de fijar `BETTER_AUTH_URL` con la URL final (`https://tu-app.vercel.app`).
5. El cron queda programado automáticamente por el `vercel.json` incluido (diario, 13:00 UTC).

Cada push a `main` genera un deploy automático.

## Seguridad

- Sesiones por cookie **httpOnly** (7 días de expiración rodante); al cerrar sesión se borra la fila en la BD.
- Páginas privadas con `Cache-Control: no-store` (el botón atrás no muestra copias en caché tras cerrar sesión).
- El endpoint del cron exige `Authorization: Bearer <CRON_SECRET>`.
- La ficha pública del QR no expone serie, costos ni notas, y los ids son UUID (no enumerables).
- Aislamiento multi-tenant verificado: sesiones cruzadas reciben 404/403, jamás datos de otra empresa.

## Design system — Chrono UI

Identidad de **ficha técnica industrial**: precisión, orden y jerarquía fuerte.

- **Tipografía:** Inter (UI) + JetBrains Mono para códigos, seriales, montos y fechas.
- **Color:** base de neutros cálidos con acento ámbar industrial; modo oscuro incluido.
- **Estados del ciclo de vida:** 🟢 operativo · 🟡 en mantenimiento · 🔴 en reparación · ⚪ retirado · 🔵 garantía activa.
- Componentes firma: tarjeta de activo con QR, timeline de historial, tabla de inventario densa, command palette.

## Roadmap

Ver [`FLUJO.md`](./FLUJO.md) para el plan completo por sprints. Próximas ideas: invitaciones por email a una misma empresa, roles por catálogo, multi-moneda.

## Desarrollador

**David Zuluaga Ceballos**

## Licencia

MIT
