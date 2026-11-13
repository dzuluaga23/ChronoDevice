import { createRouteHandler } from "uploadthing/next";
import { UTFileRouter } from "@/lib/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: UTFileRouter,
});
