import { createClient } from "@/lib/supabase/server";
import { AdminReportes } from "@/components/admin-reportes";
import { Titulo } from "@/components/ui";
import type { ActividadDia, BalanceGeneral, ReporteMoneda, ReporteUsuarioTop } from "@/lib/types";

export const metadata = { title: "Reportes de administración" };

const num = (v: unknown) => Number(v ?? 0);

export default async function AdminReportesPage() {
  const supabase = await createClient();

  const [balance, monedas, usuarios, actividad] = await Promise.all([
    supabase.rpc("balance_general"),
    supabase.rpc("reporte_monedas"),
    supabase.rpc("reporte_usuarios_top", { p_limite: 10 }),
    supabase.rpc("reporte_actividad_diaria", { p_dias: 14 }),
  ]);

  const error = balance.error ?? monedas.error ?? usuarios.error ?? actividad.error;
  if (error) {
    return <p className="rounded-lg border border-down/40 bg-down/10 p-4 text-sm text-down">{error.message}</p>;
  }

  const b = balance.data as BalanceGeneral;
  const datosBalance: BalanceGeneral = {
    usuarios: num(b.usuarios),
    usuarios_activos: num(b.usuarios_activos),
    saldo_total: num(b.saldo_total),
    valor_portafolios: num(b.valor_portafolios),
    patrimonio_total: num(b.patrimonio_total),
    transacciones: num(b.transacciones),
    volumen_total: num(b.volumen_total),
  };

  return (
    <>
      <Titulo
        titulo="Reportes de administración"
        descripcion="Balance general de la plataforma, monedas más operadas y usuarios más activos."
      />
      <AdminReportes
        balance={datosBalance}
        monedas={((monedas.data ?? []) as ReporteMoneda[]).map((m) => ({
          ...m,
          compras: num(m.compras),
          ventas: num(m.ventas),
          volumen_compra: num(m.volumen_compra),
          volumen_venta: num(m.volumen_venta),
        }))}
        usuarios={((usuarios.data ?? []) as ReporteUsuarioTop[]).map((u) => ({
          ...u,
          transacciones: num(u.transacciones),
          volumen: num(u.volumen),
        }))}
        actividad={((actividad.data ?? []) as ActividadDia[]).map((a) => ({
          dia: String(a.dia),
          compras: num(a.compras),
          ventas: num(a.ventas),
        }))}
      />
    </>
  );
}
