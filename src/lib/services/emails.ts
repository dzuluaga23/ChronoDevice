/**
 * Envío de correos con Resend. Sin RESEND_API_KEY el envío se salta
 * (solo se registra en el log) para que la app siga funcionando.
 * Free tier de Resend: 3.000 correos/mes; sin dominio verificado solo
 * permite enviar desde onboarding@resend.dev a tu propio email.
 */
const FROM_DEFAULT = "ChronoDevice <onboarding@resend.dev>";

interface DigestItem {
  type: string;
  assetCode: string | null;
  assetName: string | null;
  dueDate: Date;
}

const TYPE_LABELS: Record<string, string> = {
  garantia_vencida: "Garantía vencida",
  garantia_por_vencer: "Garantía por vencer",
  mantenimiento_programado: "Mantenimiento programado",
};

/** Correo-resumen con las alertas pendientes de una empresa. */
export async function sendAlertsDigest(options: {
  to: string[];
  companyName: string;
  alerts: DigestItem[];
}): Promise<{ sent: boolean; skipped?: string }> {
  const { to, companyName, alerts } = options;
  if (to.length === 0 || alerts.length === 0) {
    return { sent: false, skipped: "nada que enviar" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      `[emails] RESEND_API_KEY no configurada: se saltó el envío de ${alerts.length} alerta(s) de ${companyName} a ${to.length} destinatario(s)`,
    );
    return { sent: false, skipped: "sin RESEND_API_KEY" };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const rows = alerts
    .map(
      (a) =>
        `<li><strong>${TYPE_LABELS[a.type] ?? a.type}</strong> — ` +
        `${a.assetCode ?? ""} ${a.assetName ?? "Activo"} · ` +
        `fecha: ${new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(a.dueDate)}</li>`,
    )
    .join("");

  const html =
    `<div style="font-family:sans-serif;max-width:560px">` +
    `<h2 style="margin:0 0 4px">ChronoDevice — ${companyName}</h2>` +
    `<p style="color:#555">Tienes ${alerts.length} alerta(s) pendiente(s):</p>` +
    `<ul>${rows}</ul>` +
    `<p style="color:#888;font-size:12px">Revisa el centro de alertas en la app para gestionarlas.</p>` +
    `</div>`;

  const from = process.env.RESEND_FROM ?? FROM_DEFAULT;
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `ChronoDevice: ${alerts.length} alerta(s) pendiente(s)`,
    html,
  });

  if (error) {
    console.error("[emails] Resend devolvió error:", error);
    return { sent: false, skipped: "error de Resend" };
  }
  return { sent: true };
}
