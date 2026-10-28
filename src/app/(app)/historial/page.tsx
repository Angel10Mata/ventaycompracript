import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTransacciones } from "@/lib/data";
import { TablaTransacciones } from "@/components/tabla-transacciones";
import { Titulo } from "@/components/ui";

export const metadata = { title: "Historial" };

export default async function HistorialPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filas = await getTransacciones(supabase, user.id);

  return (
    <>
      <Titulo
        titulo="Historial de transacciones"
        descripcion="Todas tus compras y ventas. Filtra y exporta a Excel o PDF."
      />
      <TablaTransacciones filas={filas} titulo="Historial de transacciones" archivo="historial-transacciones" />
    </>
  );
}
