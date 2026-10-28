export type Rol = "usuario" | "admin" | "super";

/** Los roles admin y super acceden al panel de administración. */
export const esAdmin = (rol: Rol | string | null | undefined) => rol === "admin" || rol === "super";
export type EstadoCuenta = "activo" | "suspendido" | "baja";

export interface Perfil {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: EstadoCuenta;
  saldo: number;
  creado_en: string;
}

export interface Cripto {
  id: number;
  nombre: string;
  simbolo: string;
  precio_actual: number;
  precio_base: number;
  volatilidad: number;
  activa: boolean;
  actualizado_en: string;
}

export interface TenenciaPortafolio {
  cripto_id: number;
  cantidad: number;
}

export interface Transaccion {
  id: number;
  usuario_id: string;
  cripto_id: number;
  tipo: "compra" | "venta";
  cantidad: number;
  precio_unitario: number;
  total: number;
  saldo_posterior: number;
  creado_en: string;
  criptomonedas: { simbolo: string; nombre: string } | null;
}

export interface PuntoPrecio {
  precio: number;
  registrado_en: string;
}

export interface ReporteMoneda {
  simbolo: string;
  nombre: string;
  compras: number;
  ventas: number;
  volumen_compra: number;
  volumen_venta: number;
}

export interface ReporteUsuarioTop {
  usuario_id: string;
  nombre: string;
  correo: string;
  estado: EstadoCuenta;
  transacciones: number;
  volumen: number;
}

export interface BalanceGeneral {
  usuarios: number;
  usuarios_activos: number;
  saldo_total: number;
  valor_portafolios: number;
  patrimonio_total: number;
  transacciones: number;
  volumen_total: number;
}

export interface ActividadDia {
  dia: string;
  compras: number;
  ventas: number;
}

export interface RegistroAuditoria {
  id: number;
  usuario_id: string | null;
  accion: string;
  detalle: Record<string, unknown>;
  creado_en: string;
  profiles: { nombre: string | null; email: string | null } | null;
}

/** Saldo ficticio con el que inicia cada cuenta (debe coincidir con db/schema.sql). */
export const SALDO_INICIAL = 10000;
