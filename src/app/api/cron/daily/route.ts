/**
 * CRON diario (Vercel Cron → GET /api/cron/daily con Authorization: Bearer
 * CRON_SECRET). Para cada empresa:
 *  1. genera alertas (garantías por vencer/vencidas, mantenimientos próximos)
 *  2. envía el resumen por correo a los miembros (si hay RESEND_API_KEY)
 * Sin CRON_SECRET en .env, solo corre manualmente desde la sesión de admin.
 */
import { handle, unauthorized, jsonOk } from "@/lib/api/http";
import * as alertsService from "@/lib/services/alerts";
import * as alertsRepo from "@/lib/repositories/alerts";
import * as companiesRepo from "@/lib/repositories/companies";
import { sendAlertsDigest } from "@/lib/services/emails";

export const GET = handle(async (request: Request) => {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    throw unauthorized("Cron no autorizado");
  }

  const now = new Date();
  const companies = await companiesRepo.listAllCompanies();

  const perCompany = [];
  for (const company of companies) {
    const created = await alertsService.generateAlertsForCompany(
      company.id,
      now,
    );
    const pending = await alertsRepo.countPendingAlerts(company.id);

    let email: { sent: boolean; skipped?: string } = {
      sent: false,
      skipped: "sin alertas pendientes",
    };
    if (pending > 0) {
      const members = await companiesRepo.listCompanyMembersWithUser(
        company.id,
      );
      const to = members.map((m) => m.email);
      const alerts = await alertsRepo.listAlerts(company.id);
      const pendingAlerts = alerts
        .filter((a) => a.status === "pendiente")
        .map((a) => ({
          type: a.type,
          assetCode: a.assetCode,
          assetName: a.assetName,
          dueDate: a.dueDate,
        }));
      email = await sendAlertsDigest({
        to,
        companyName: company.name,
        alerts: pendingAlerts,
      });
    }

    perCompany.push({
      company: company.name,
      created: created.length,
      pending,
      emailSent: email.sent,
      emailSkipped: email.skipped ?? null,
    });
  }

  return jsonOk({ ranAt: now.toISOString(), companies: perCompany });
});
