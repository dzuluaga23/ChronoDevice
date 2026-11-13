import { handle, jsonOk } from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/session";
import * as attachmentsService from "@/lib/services/attachments";

type RouteParams = { params: Promise<{ id: string }> };

export const DELETE = handle(async (_request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  const { id } = await params;
  const row = await attachmentsService.deleteAttachment(ctx, id);
  return jsonOk(row);
});
