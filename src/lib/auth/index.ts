import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";

/**
 * Better Auth — autenticación por email + contraseña.
 * `activeCompanyId` vive en la sesión: es la empresa con la que el
 * usuario está trabajando (multi-tenant).
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    additionalFields: {
      activeCompanyId: {
        type: "string",
        required: false,
        returned: true,
        input: false, // solo se setea desde el servidor
      },
    },
  },
  user: {
    additionalFields: {
      fullName: {
        type: "string",
        required: false,
        returned: true,
      },
    },
  },
  plugins: [nextCookies()], // último plugin siempre
});

export type Session = typeof auth.$Infer.Session;
