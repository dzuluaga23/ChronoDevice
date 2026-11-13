import { NextResponse, type NextRequest } from "next/server";

/**
 * Páginas privadas: la respuesta no se guarda en caché HTTP. Así el botón
 * "atrás" del navegador no muestra una copia muerta de una sesión cerrada.
 * (El redirect real lo hacen las guardas RSC; esto refuerza el caché.)
 */
const PRIVATE_PREFIXES = [
  "/activos",
  "/catalogos",
  "/mantenimientos",
  "/escanear",
  "/alertas",
  "/dashboard",
  "/crear-empresa",
];

export default function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  if (PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  matcher: [
    "/activos/:path*",
    "/catalogos",
    "/mantenimientos",
    "/escanear",
    "/alertas",
    "/dashboard",
    "/crear-empresa",
  ],
};
