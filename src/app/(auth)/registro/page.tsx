import { redirectIfAuthenticated } from "@/lib/auth/rsc";
import RegistroPage from "./page-client";

export const metadata = { title: "Crear cuenta" };
// Redirige según sesión: request-time.
export const instant = false;

export default async function RegistroPageServer() {
  await redirectIfAuthenticated();
  return <RegistroPage />;
}
