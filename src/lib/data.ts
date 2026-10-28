import type { SupabaseClient } from "@supabase/supabase-js";
import type { Transaccion } from "@/lib/types";

/** Transacciones de un usuario (RLS: solo las propias, o cualquiera si es admin). */
export async function getTransacciones(supabase: SupabaseClient, usuarioId: string, limite = 1000) {
  const { data } = await supabase
    .from("transacciones")
    .select("*, criptomonedas(simbolo, nombre)")
    .eq("usuario_id", usuarioId)
    .order("creado_en", { ascending: false })
    .limit(limite);

  return (data ?? []).map((t) => ({
    ...t,
    cantidad: Number(t.cantidad),
    precio_unitario: Number(t.precio_unitario),
    total: Number(t.total),
    saldo_posterior: Number(t.saldo_posterior),
  })) as Transaccion[];
}
