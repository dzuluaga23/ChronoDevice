import { handle, jsonList } from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/session";
import * as attachmentsService from "@/lib/services/attachments";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = handle(async (_request: Request, { params }: RouteParams) => {
  const ctx = await requireAuth();
  const { id } = await params;
  const items = await attachmentsService.listAttachments(ctx, id);
  return jsonList(items, items.length);
});
