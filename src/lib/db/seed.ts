/**
 * Seed de datos de prueba — ChronoDevice
 * Crea la empresa demo con catálogos, activos y registros de ciclo de vida.
 * Idempotente: borra la empresa demo antes de insertar.
 *
 * Importante: cargar .env.local ANTES de importar el cliente de BD,
 * porque los imports estáticos se evalúan antes que el resto del módulo.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

const DEMO_SLUG = "democorp";

async function seed() {
  const { eq } = await import("drizzle-orm");
  const { db, pool } = await import("./index");
  const {
    assets,
    brands,
    categories,
    companies,
    locations,
    maintenances,
    repairs,
    suppliers,
    warranties,
  } = await import("./schema");

  console.log("🌱 Sembrando datos de prueba...");

  // Idempotencia: eliminar la empresa demo (cascade borra todo lo demás)
  await db.delete(companies).where(eq(companies.slug, DEMO_SLUG));

  const [company] = await db
    .insert(companies)
    .values({ name: "DemoCorp S.A.S", slug: DEMO_SLUG })
    .returning();

  const [catComputo, catImpresion, catCelular, catHerramienta] = await db
    .insert(categories)
    .values([
      { companyId: company.id, name: "Computadores", description: "Equipos de cómputo" },
      { companyId: company.id, name: "Impresoras" },
      { companyId: company.id, name: "Celulares" },
      { companyId: company.id, name: "Herramientas" },
    ])
    .returning();

  const [brandLenovo, brandHp, brandSamsung, brandBosch] = await db
    .insert(brands)
    .values([
      { companyId: company.id, name: "Lenovo" },
      { companyId: company.id, name: "HP" },
      { companyId: company.id, name: "Samsung" },
      { companyId: company.id, name: "Bosch" },
    ])
    .returning();

  const [locSede, locOficina] = await db
    .insert(locations)
    .values([
      { companyId: company.id, name: "Sede Principal", address: "Calle 10 #25-30, Medellín" },
      { companyId: company.id, name: "Oficina 201" },
    ])
    .returning();

  const [supAndina, supTecno] = await db
    .insert(suppliers)
    .values([
      {
        companyId: company.id,
        name: "Distribuidora Andina",
        contactName: "Carlos Pérez",
        phone: "+57 300 123 4567",
        email: "ventas@andina.com",
      },
      {
        companyId: company.id,
        name: "TecnoSuministros",
        contactName: "Ana Gómez",
        phone: "+57 301 987 6543",
        email: "contacto@tecnosuministros.com",
      },
    ])
    .returning();

  const insertedAssets = await db
    .insert(assets)
    .values([
      {
        companyId: company.id,
        code: "AST-0001",
        name: "Portátil ThinkPad L14",
        categoryId: catComputo.id,
        brandId: brandLenovo.id,
        model: "ThinkPad L14 Gen 4",
        serialNumber: "PF3R8X2T",
        status: "operativo",
        locationId: locOficina.id,
        supplierId: supAndina.id,
        purchaseDate: new Date("2024-03-15"),
        purchasePrice: "3250000.00",
        notes: "Asignado al área contable.",
      },
      {
        companyId: company.id,
        code: "AST-0002",
        name: "Impresora multifuncional LaserJet",
        categoryId: catImpresion.id,
        brandId: brandHp.id,
        model: "LaserJet Pro MFP M428",
        serialNumber: "CNB8K21045",
        status: "en_mantenimiento",
        locationId: locSede.id,
        supplierId: supTecno.id,
        purchaseDate: new Date("2023-08-02"),
        purchasePrice: "1890000.00",
      },
      {
        companyId: company.id,
        code: "AST-0003",
        name: "Celular Galaxy A54",
        categoryId: catCelular.id,
        brandId: brandSamsung.id,
        model: "SM-A546E",
        serialNumber: "RZ8T30AB1XY",
        status: "operativo",
        locationId: locSede.id,
        supplierId: supAndina.id,
        purchaseDate: new Date("2025-01-20"),
        purchasePrice: "1450000.00",
      },
      {
        companyId: company.id,
        code: "AST-0004",
        name: "Taladro percutor GSB 20-2",
        categoryId: catHerramienta.id,
        brandId: brandBosch.id,
        model: "GSB 20-2 Professional",
        status: "en_reparacion",
        locationId: locSede.id,
        supplierId: supTecno.id,
        purchaseDate: new Date("2022-11-10"),
        purchasePrice: "520000.00",
        notes: "Mandril con holgura excesiva.",
      },
    ])
    .returning();

  await db.insert(maintenances).values([
    {
      companyId: company.id,
      assetId: insertedAssets[0].id,
      type: "preventivo",
      performedAt: new Date("2025-09-01"),
      nextAt: new Date("2026-03-01"),
      description: "Limpieza interna y cambio de pasta térmica.",
      cost: "85000.00",
      technician: "Servicios Técnicos MG",
    },
    {
      companyId: company.id,
      assetId: insertedAssets[1].id,
      type: "correctivo",
      performedAt: new Date("2026-01-15"),
      nextAt: new Date("2026-07-15"),
      description: "Cambio de kit de rodillos.",
      cost: "220000.00",
      technician: "Servicios Técnicos MG",
    },
  ]);

  await db.insert(repairs).values([
    {
      companyId: company.id,
      assetId: insertedAssets[3].id,
      failureDescription: "El mandril patina al perforar en concreto.",
      repairedAt: new Date("2026-02-10"),
      cost: "95000.00",
      technician: "Taller Bosch Autorizado",
    },
  ]);

  await db.insert(warranties).values([
    {
      companyId: company.id,
      assetId: insertedAssets[2].id,
      startDate: new Date("2025-01-20"),
      endDate: new Date("2026-11-20"),
      provider: "Samsung Colombia",
      coverageNotes: "Cubre defectos de fábrica. No cubre daño por humedad.",
    },
    {
      companyId: company.id,
      assetId: insertedAssets[0].id,
      startDate: new Date("2024-03-15"),
      endDate: new Date("2027-03-15"),
      provider: "Lenovo Colombia",
    },
  ]);

  console.log(`✅ Datos listos — empresa: ${company.name}`);
  console.log(`   ${insertedAssets.length} activos, catálogos y ciclo de vida.`);

  await pool.end();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error en el seed:", err);
    process.exit(1);
  });
