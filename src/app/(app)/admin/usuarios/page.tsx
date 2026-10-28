import { createClient } from "@/lib/supabase/server";
import { AdminUsuarios, type UsuarioFila } from "@/components/admin-usuarios";
import { Titulo } from "@/components/ui";
import { normalizarPerfil, type FilaProfile } from "@/lib/perfil";

export const metadata = { title: "Usuarios" };

export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfiles }, { data: top }] = await Promise.all([
    supabase.from("profiles").select("*, billeteras(saldo, estado)").order("created_at", { ascending: false }),
    supabase.rpc("reporte_usuarios_top", { p_limite: 100000 }),
  ]);

  const conteo = new Map<string, number>(
    ((top ?? []) as { usuario_id: string; transacciones: number }[]).map((t) => [t.usuario_id, Number(t.transacciones)]),
  );

  const usuarios: UsuarioFila[] = ((perfiles ?? []) as FilaProfile[]).map((f) => normalizarPerfil(f)).map((p) => ({
    ...p,
    transacciones: conteo.get(p.id) ?? 0,
  }));

  return (
    <>
      <Titulo
        titulo="Gestión de usuarios"
        descripcion="Suspende, reactiva o da de baja cuentas. Los cambios se registran en la auditoría."
      />
      <AdminUsuarios usuarios={usuarios} adminId={user?.id ?? ""} />
    </>
  );
}
