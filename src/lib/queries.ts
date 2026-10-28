"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { normalizarPerfil, type FilaProfile } from "@/lib/perfil";
import type { Cripto, PuntoPrecio, TenenciaPortafolio } from "@/lib/types";

const supabase = createClient();

/** Catálogo con precios simulados; se refresca cada 5 s. */
export function useCriptos() {
  return useQuery({
    queryKey: ["criptos"],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase.from("criptomonedas").select("*").eq("activa", true).order("id");
      if (error) throw error;
      return (data ?? []).map((c) => ({
        ...c,
        precio_actual: Number(c.precio_actual),
        precio_base: Number(c.precio_base),
      })) as Cripto[];
    },
  });
}

export function usePerfil(userId: string) {
  return useQuery({
    queryKey: ["perfil", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, billeteras(saldo, estado)")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return normalizarPerfil(data as FilaProfile);
    },
  });
}

export function usePortafolio(userId: string) {
  return useQuery({
    queryKey: ["portafolio", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portafolio")
        .select("cripto_id, cantidad")
        .eq("usuario_id", userId)
        .gt("cantidad", 0);
      if (error) throw error;
      return (data ?? []).map((t) => ({ ...t, cantidad: Number(t.cantidad) })) as TenenciaPortafolio[];
    },
  });
}

export function useHistorialPrecios(criptoId: number | undefined, limite = 60) {
  return useQuery({
    queryKey: ["historial-precios", criptoId, limite],
    enabled: criptoId !== undefined,
    refetchInterval: 6000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial_precios")
        .select("precio, registrado_en")
        .eq("cripto_id", criptoId!)
        .order("registrado_en", { ascending: false })
        .limit(limite);
      if (error) throw error;
      return (data ?? [])
        .map((p) => ({ precio: Number(p.precio), registrado_en: p.registrado_en }))
        .reverse() as PuntoPrecio[];
    },
  });
}
