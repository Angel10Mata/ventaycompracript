"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registroSchema } from "@/lib/validators";

export type ResultadoAuth = { error?: string; mensaje?: string };

export async function loginAction(input: unknown): Promise<ResultadoAuth> {
  // Validación del lado servidor (nunca confiar solo en el cliente)
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.correo,
    password: parsed.data.password,
  });
  if (error || !data.user) return { error: "Correo o contraseña incorrectos" };

  const { data: perfil } = await supabase.from("billeteras").select("estado").eq("usuario_id", data.user.id).single();
  if (perfil?.estado === "suspendido") {
    await supabase.auth.signOut();
    return { error: "Tu cuenta está suspendida. Contacta al administrador." };
  }
  if (!perfil || perfil.estado === "baja") {
    await supabase.auth.signOut();
    return { error: "Tu cuenta fue dada de baja." };
  }

  await supabase.rpc("registrar_login"); // auditoría de sesiones
  redirect("/dashboard");
}

export async function registroAction(input: unknown): Promise<ResultadoAuth> {
  const parsed = registroSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.correo,
    password: parsed.data.password,
    options: { data: { nombre: parsed.data.nombre } },
  });

  if (error) {
    if (/already|registered/i.test(error.message)) return { error: "Ya existe una cuenta con ese correo" };
    return { error: "No se pudo crear la cuenta. Intenta de nuevo." };
  }

  // Si el proyecto exige confirmación por correo, no hay sesión todavía
  if (!data.session) {
    return { mensaje: "Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión." };
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
