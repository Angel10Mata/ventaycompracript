import type { EstadoCuenta, Perfil, Rol } from "@/lib/types";

type Billetera = { saldo: number | string; estado: EstadoCuenta };

/** Fila de `profiles` con su billetera embebida: select("*, billeteras(saldo, estado)"). */
export interface FilaProfile {
  id: string;
  nombre: string | null;
  email: string | null;
  rol: string | null;
  created_at: string | null;
  billeteras?: Billetera | Billetera[] | null;
}

/** Une profiles + billeteras en el modelo único que usa la interfaz. */
export function normalizarPerfil(f: FilaProfile): Perfil {
  const b = Array.isArray(f.billeteras) ? f.billeteras[0] : f.billeteras;
  return {
    id: f.id,
    nombre: f.nombre ?? "",
    correo: f.email ?? "",
    rol: (f.rol ?? "usuario") as Rol,
    estado: b?.estado ?? "baja",
    saldo: Number(b?.saldo ?? 0),
    creado_en: f.created_at ?? "",
  };
}
