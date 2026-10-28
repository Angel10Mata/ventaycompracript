"use server";

import { createClient } from "@/lib/supabase/server";
import { operacionSchema } from "@/lib/validators";

export type ResultadoOperacion = { ok: true; total: number; saldo: number } | { ok: false; error: string };

/**
 * Compra o venta. La validación se repite aquí (servidor) y la operación
 * se ejecuta de forma atómica en PostgreSQL (funciones comprar_cripto / vender_cripto),
 * que además verifican saldo, tenencia y estado de la cuenta.
 */
export async function operarAction(input: unknown): Promise<ResultadoOperacion> {
  const parsed = operacionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Inicia sesión de nuevo." };

  const { criptoId, tipo, cantidad } = parsed.data;
  const { data, error } = await supabase.rpc(tipo === "compra" ? "comprar_cripto" : "vender_cripto", {
    p_cripto_id: criptoId,
    p_cantidad: cantidad,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, total: Number(data.total), saldo: Number(data.saldo) };
}
