import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/actions/auth";
import { Button, Card } from "@/components/ui";

export const metadata = { title: "Cuenta no disponible" };

export default async function CuentaInactivaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase.from("billeteras").select("estado").eq("usuario_id", user.id).single();
  if (perfil?.estado === "activo") redirect("/dashboard");

  const texto =
    perfil?.estado === "baja"
      ? "Tu cuenta fue dada de baja por un administrador."
      : "Tu cuenta está suspendida temporalmente. Contacta a un administrador para reactivarla.";

  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-4">
      <Card className="space-y-4 p-6 text-center">
        <ShieldAlert className="mx-auto size-10 text-down" aria-hidden />
        <h1 className="text-xl font-semibold">Cuenta no disponible</h1>
        <p className="text-sm text-muted">{texto}</p>
        <form action={logoutAction}>
          <Button variante="secundario" type="submit">
            Cerrar sesión
          </Button>
        </form>
      </Card>
    </main>
  );
}
