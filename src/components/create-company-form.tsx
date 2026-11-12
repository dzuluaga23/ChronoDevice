"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** POST /api/companies crea la empresa y la deja activa en la sesión. */
export default function CreateCompanyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = (await res.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;

    if (!res.ok) {
      toast.error(body?.error?.message ?? "No se pudo crear la empresa");
      setLoading(false);
      return;
    }
    toast.success("Empresa creada");
    router.push("/activos");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Crea tu empresa</CardTitle>
        <CardDescription>
          Tus activos, catálogos y equipo vivirán aquí, aislados de otras
          empresas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre de la empresa</Label>
            <Input
              id="name"
              required
              minLength={2}
              maxLength={120}
              placeholder="Ej: Mi Empresa S.A.S"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Creando…" : "Crear empresa"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
