"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cambioEstadoSchema } from "@/lib/validators";

export async function cambiarEstadoAction(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = cambioEstadoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };

  const supabase = await createClient();
  // La función SQL verifica que quien llama sea administrador activo
  const { error } = await supabase.rpc("admin_cambiar_estado", {
    p_usuario: parsed.data.usuarioId,
    p_estado: parsed.data.estado,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/auditoria");
  return { ok: true };
}
