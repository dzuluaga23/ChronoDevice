import { redirectIfHasCompany } from "@/lib/auth/rsc";
import CreateCompanyForm from "@/components/create-company-form";

export const metadata = { title: "Crear empresa" };
// Depende de la sesión para redirigir.
export const instant = false;

export default async function CrearEmpresaPage() {
  // Sin sesión → /login · con empresa → /activos
  await redirectIfHasCompany();
  return <CreateCompanyForm />;
}
