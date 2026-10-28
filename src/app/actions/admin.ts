"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cambioEstadoSchema, crearUsuarioAdminSchema } from "@/lib/validators";

async function exigeAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sesión no válida" };

  const { data: esAdmin, error } = await supabase.rpc("es_admin");
  if (error || !esAdmin) return { ok: false as const, error: "Acceso denegado" };
  return { ok: true as const, supabase, adminId: user.id };
}

export async function crearUsuarioAction(
  input: unknown,
): Promise<{ ok: boolean; error?: string; mensaje?: string }> {
  const parsed = crearUsuarioAdminSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };

  const gate = await exigeAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en .env.local (Supabase → Settings → API).",
    };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.correo,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { nombre: parsed.data.nombre },
  });

  if (error || !data.user) {
    if (/already|registered|exists/i.test(error?.message ?? "")) {
      return { ok: false, error: "Ya existe una cuenta con ese correo" };
    }
    return { ok: false, error: error?.message ?? "No se pudo crear el usuario" };
  }

  await admin.from("auditoria").insert({
    usuario_id: gate.adminId,
    accion: "creacion_usuario",
    detalle: {
      nombre: parsed.data.nombre,
      correo: parsed.data.correo,
      nuevo_usuario_id: data.user.id,
    },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/auditoria");
  return {
    ok: true,
    mensaje: `Usuario ${parsed.data.nombre} creado. Puede iniciar sesión con su correo y contraseña.`,
  };
}

export async function cambiarEstadoAction(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = cambioEstadoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" };

  const gate = await exigeAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const supabase = gate.supabase;
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
