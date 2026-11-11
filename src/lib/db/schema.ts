/**
 * Esquema de ChronoDevice — Drizzle ORM + Neon Postgres
 *
 * Regla multi-tenant: toda tabla de negocio lleva `companyId`.
 * Las queries SIEMPRE filtran por la empresa del usuario en sesión
 * (la regla vive en src/lib/repositories).
 */
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/* ───────────────────────── Enums ───────────────────────── */

export const memberRoleEnum = pgEnum("member_role", [
  "admin",
  "tecnico",
  "consulta",
]);

export const assetStatusEnum = pgEnum("asset_status", [
  "operativo",
  "en_mantenimiento",
  "en_reparacion",
  "retirado",
]);

export const attachmentKindEnum = pgEnum("attachment_kind", [
  "foto",
  "documento",
]);

export const maintenanceTypeEnum = pgEnum("maintenance_type", [
  "preventivo",
  "correctivo",
  "otros",
]);

export const alertTypeEnum = pgEnum("alert_type", [
  "garantia_vencida",
  "garantia_por_vencer",
  "mantenimiento_programado",
]);

export const alertStatusEnum = pgEnum("alert_status", [
  "pendiente",
  "enviada",
  "descartada",
]);

/* ───────────────────────── Empresas y membresías ───────────────────────── */

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Usuario ↔ Empresa + rol. FK al usuario de Better Auth. */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("consulta"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("memberships_user_company_uq").on(t.userId, t.companyId)],
);

/* ───────────────────────── Catálogos ───────────────────────── */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("categories_company_name_uq").on(t.companyId, t.name)],
);

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("brands_company_name_uq").on(t.companyId, t.name)],
);

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("locations_company_name_uq").on(t.companyId, t.name)],
);

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ───────────────────────── Activos ───────────────────────── */

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    /** Código legible del activo, único por empresa (AST-0001). */
    code: text("code").notNull(),
    name: text("name").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    model: text("model"),
    serialNumber: text("serial_number"),
    status: assetStatusEnum("status").notNull().default("operativo"),
    locationId: uuid("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),
    supplierId: uuid("supplier_id").references(() => suppliers.id, {
      onDelete: "set null",
    }),
    /** Responsable del activo (usuario de Better Auth). */
    responsibleUserId: text("responsible_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    purchaseDate: timestamp("purchase_date", { withTimezone: true }),
    purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("assets_company_code_uq").on(t.companyId, t.code),
    index("assets_company_idx").on(t.companyId),
    index("assets_status_idx").on(t.companyId, t.status),
    index("assets_category_idx").on(t.companyId, t.categoryId),
  ],
);

/* ───────────────────────── Ciclo de vida ───────────────────────── */

export const maintenances = pgTable(
  "maintenances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    type: maintenanceTypeEnum("type").notNull().default("preventivo"),
    performedAt: timestamp("performed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Si se programa el próximo mantenimiento. */
    nextAt: timestamp("next_at", { withTimezone: true }),
    description: text("description").notNull(),
    cost: numeric("cost", { precision: 12, scale: 2 }),
    technician: text("technician"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("maintenances_asset_idx").on(t.assetId),
    index("maintenances_next_idx").on(t.companyId, t.nextAt),
  ],
);

export const repairs = pgTable(
  "repairs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    failureDescription: text("failure_description").notNull(),
    solution: text("solution"),
    repairedAt: timestamp("repaired_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    cost: numeric("cost", { precision: 12, scale: 2 }),
    technician: text("technician"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("repairs_asset_idx").on(t.assetId)],
);

export const warranties = pgTable(
  "warranties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    provider: text("provider"),
    coverageNotes: text("coverage_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("warranties_asset_idx").on(t.assetId),
    index("warranties_end_idx").on(t.companyId, t.endDate),
  ],
);

/* ───────────────────────── Adjuntos y alertas ───────────────────────── */

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    kind: attachmentKindEnum("kind").notNull(),
    fileName: text("file_name").notNull(),
    /** Key del objeto en Cloudflare R2. */
    fileKey: text("file_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("attachments_asset_idx").on(t.assetId)],
);

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id").references(() => assets.id, {
      onDelete: "cascade",
    }),
    type: alertTypeEnum("type").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    status: alertStatusEnum("status").notNull().default("pendiente"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("alerts_company_status_idx").on(t.companyId, t.status)],
);

/* ───────────────────────── Relaciones ───────────────────────── */

export const companiesRelations = relations(companies, ({ many }) => ({
  memberships: many(memberships),
  assets: many(assets),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  company: one(companies, {
    fields: [assets.companyId],
    references: [companies.id],
  }),
  category: one(categories, {
    fields: [assets.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [assets.brandId],
    references: [brands.id],
  }),
  location: one(locations, {
    fields: [assets.locationId],
    references: [locations.id],
  }),
  supplier: one(suppliers, {
    fields: [assets.supplierId],
    references: [suppliers.id],
  }),
  maintenances: many(maintenances),
  repairs: many(repairs),
  warranties: many(warranties),
  attachments: many(attachments),
}));
