import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTransacciones } from "@/lib/data";
import { ReportesUsuario } from "@/components/reportes-usuario";
import { Titulo } from "@/components/ui";

export const metadata = { title: "Reportes" };

export default async function ReportesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const transacciones = await getTransacciones(supabase, user.id);

  return (
    <>
      <Titulo titulo="Mis reportes" descripcion="Balance general y gráficas de tu actividad." />
      <ReportesUsuario userId={user.id} transacciones={transacciones} />
    </>
  );
}
