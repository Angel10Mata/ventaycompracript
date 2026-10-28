import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTransacciones } from "@/lib/data";
import { ReportesUsuario } from "@/components/reportes-usuario";
import { TablaTransacciones } from "@/components/tabla-transacciones";
import { Badge, Titulo } from "@/components/ui";
import { normalizarPerfil, type FilaProfile } from "@/lib/perfil";

export const metadata = { title: "Detalle de usuario" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminUsuarioDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*, billeteras(saldo, estado)").eq("id", id).single();
  if (!data) notFound();
  const perfil = normalizarPerfil(data as FilaProfile);

  const transacciones = await getTransacciones(supabase, id);

  return (
    <>
      <Link href="/admin/usuarios" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Volver a usuarios
      </Link>
      <Titulo
        titulo={perfil.nombre}
        descripcion={perfil.correo}
        acciones={<Badge tono={perfil.estado === "activo" ? "up" : perfil.estado === "suspendido" ? "accent" : "down"}>{perfil.estado}</Badge>}
      />

      <ReportesUsuario userId={id} transacciones={transacciones} />

      <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide text-muted">Historial de movimientos</h2>
      <TablaTransacciones
        filas={transacciones}
        titulo={`Movimientos de ${perfil.nombre}`}
        archivo={`movimientos-${perfil.nombre.toLowerCase().replace(/\s+/g, "-")}`}
      />
    </>
  );
}
