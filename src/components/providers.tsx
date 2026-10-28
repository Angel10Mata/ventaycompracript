"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createClient } from "@/lib/supabase/client";
import type { Rol } from "@/lib/types";

interface Sesion {
  userId: string;
  nombre: string;
  rol: Rol;
}

const SesionContext = createContext<Sesion | null>(null);

export function useSesion(): Sesion {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error("useSesion debe usarse dentro de <Providers>");
  return ctx;
}

/**
 * Simula el mercado: cada 6 s pide a la base de datos un "tick" de precios.
 * La función SQL limita a un tick cada 5 s en total, aunque haya varias pestañas abiertas.
 */
function PriceTicker() {
  const qc = useQueryClient();
  useEffect(() => {
    const supabase = createClient();
    let activo = true;
    const tick = async () => {
      if (document.hidden) return;
      const { data } = await supabase.rpc("simular_precios");
      if (activo && data === true) {
        qc.invalidateQueries({ queryKey: ["criptos"] });
        qc.invalidateQueries({ queryKey: ["historial-precios"] });
      }
    };
    tick();
    const id = setInterval(tick, 6000);
    return () => {
      activo = false;
      clearInterval(id);
    };
  }, [qc]);
  return null;
}

export function Providers({ sesion, children }: { sesion: Sesion; children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 2000, refetchOnWindowFocus: true } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <SesionContext.Provider value={sesion}>
        <PriceTicker />
        {children}
        <ToastContainer position="bottom-right" theme="dark" autoClose={3500} />
      </SesionContext.Provider>
    </QueryClientProvider>
  );
}
