"use client";

/**
 * Helpers de cliente para Better Auth (fetch directo a /api/auth/*).
 * Las cookies de sesión son same-origin, no hay que pasar credenciales.
 */

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as
    | { error?: { message?: string }; message?: string }
    | null;

  if (!res.ok) {
    return {
      ok: false as const,
      error: json?.error?.message ?? json?.message ?? "Error inesperado",
    };
  }
  return { ok: true as const, data: json };
}

export function signUpEmail(input: {
  name: string;
  fullName: string;
  email: string;
  password: string;
}) {
  return post("/api/auth/sign-up/email", input);
}

export function signInEmail(input: { email: string; password: string }) {
  return post("/api/auth/sign-in/email", input);
}

export function signOut() {
  return post("/api/auth/sign-out", {});
}
