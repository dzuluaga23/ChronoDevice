import { redirectIfAuthenticated } from "@/lib/auth/rsc";
import LoginForm from "./page-client";

export const metadata = { title: "Entrar" };
// Redirige según sesión: request-time.
export const instant = false;

export default async function LoginPage() {
  await redirectIfAuthenticated();
  return <LoginForm />;
}
