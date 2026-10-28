import { esAdmin } from "@/lib/types";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Guardia de rol: solo administradores activos acceden a /admin/*. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("profiles").select("rol, billeteras(estado)").eq("id", user.id).single();
  const b = Array.isArray(data?.billeteras) ? data.billeteras[0] : data?.billeteras;
  if (!esAdmin(data?.rol) || b?.estado !== "activo") redirect("/dashboard");

  return <>{children}</>;
}
