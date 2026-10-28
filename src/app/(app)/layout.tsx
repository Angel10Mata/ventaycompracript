import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import { normalizarPerfil, type FilaProfile } from "@/lib/perfil";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("*, billeteras(saldo, estado)")
    .eq("id", user.id)
    .single();
  const perfil = data ? normalizarPerfil(data as FilaProfile) : null;

  // Cuentas suspendidas o dadas de baja pierden acceso inmediato
  if (!perfil || perfil.estado !== "activo") redirect("/cuenta-inactiva");

  return (
    <Providers sesion={{ userId: perfil.id, nombre: perfil.nombre, rol: perfil.rol }}>
      <Shell>{children}</Shell>
    </Providers>
  );
}
