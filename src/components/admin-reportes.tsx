"use client";

import { Download } from "lucide-react";
import { ActividadLinea, ComprasVentasBar, TopUsuariosBar } from "@/components/charts";
import { Badge, Button, Card, Stat, Tabla, td, th } from "@/components/ui";
import { dinero } from "@/lib/format";
import { exportarExcel } from "@/lib/export";
import type { ActividadDia, BalanceGeneral, ReporteMoneda, ReporteUsuarioTop } from "@/lib/types";

export function AdminReportes({
  balance,
  monedas,
  usuarios,
  actividad,
}: {
  balance: BalanceGeneral;
  monedas: ReporteMoneda[];
  usuarios: ReporteUsuarioTop[];
  actividad: ActividadDia[];
}) {
  const masComprada = [...monedas].sort((a, b) => b.compras - a.compras)[0];
  const masVendida = [...monedas].sort((a, b) => b.ventas - a.ventas)[0];

  return (
    <div className="space-y-6">
      {/* Balance general */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat etiqueta="Usuarios" valor={balance.usuarios} detalle={`${balance.usuarios_activos} activos`} />
        <Stat etiqueta="Patrimonio total" valor={dinero(balance.patrimonio_total)} detalle="Saldos + portafolios" />
        <Stat
          etiqueta="Efectivo en cuentas"
          valor={dinero(balance.saldo_total)}
          detalle={`${dinero(balance.valor_portafolios)} en criptomonedas`}
        />
        <Stat
          etiqueta="Transacciones"
          valor={balance.transacciones}
          detalle={`Volumen ${dinero(balance.volumen_total)}`}
        />
      </div>

      {/* Moneda más comprada / vendida */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Moneda más comprada</p>
            <p className="mt-1 text-xl font-semibold">
              {masComprada && masComprada.compras > 0 ? `${masComprada.nombre} (${masComprada.simbolo})` : "—"}
            </p>
          </div>
          {masComprada && masComprada.compras > 0 && <Badge tono="up">{masComprada.compras} compras</Badge>}
        </Card>
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Moneda más vendida</p>
            <p className="mt-1 text-xl font-semibold">
              {masVendida && masVendida.ventas > 0 ? `${masVendida.nombre} (${masVendida.simbolo})` : "—"}
            </p>
          </div>
          {masVendida && masVendida.ventas > 0 && <Badge tono="down">{masVendida.ventas} ventas</Badge>}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
            Compras y ventas por moneda (cantidad de operaciones)
          </h2>
          <ComprasVentasBar datos={monedas.map((m) => ({ simbolo: m.simbolo, compras: m.compras, ventas: m.ventas }))} />
        </Card>
        <Card>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Actividad de los últimos 14 días</h2>
          <ActividadLinea datos={actividad} />
        </Card>
      </div>

      {/* Tabla de monedas */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Detalle por moneda</h2>
          <Button
            variante="secundario"
            onClick={() =>
              exportarExcel(
                "reporte-monedas",
                [
                  { titulo: "Moneda" },
                  { titulo: "Símbolo", ancho: 10 },
                  { titulo: "Compras", ancho: 10 },
                  { titulo: "Ventas", ancho: 10 },
                  { titulo: "Volumen comprado" },
                  { titulo: "Volumen vendido" },
                ],
                monedas.map((m) => [m.nombre, m.simbolo, m.compras, m.ventas, m.volumen_compra, m.volumen_venta]),
              )
            }
          >
            <Download className="size-4" aria-hidden /> Excel
          </Button>
        </div>
        <Tabla>
          <thead>
            <tr>
              <th className={th}>Moneda</th>
              <th className={`${th} text-right`}>Compras</th>
              <th className={`${th} text-right`}>Ventas</th>
              <th className={`${th} text-right`}>Volumen comprado</th>
              <th className={`${th} text-right`}>Volumen vendido</th>
            </tr>
          </thead>
          <tbody>
            {monedas.map((m) => (
              <tr key={m.simbolo}>
                <td className={td}>
                  <span className="font-medium">{m.simbolo}</span> <span className="text-muted">{m.nombre}</span>
                </td>
                <td className={`${td} num text-right`}>{m.compras}</td>
                <td className={`${td} num text-right`}>{m.ventas}</td>
                <td className={`${td} num text-right`}>{dinero(m.volumen_compra)}</td>
                <td className={`${td} num text-right`}>{dinero(m.volumen_venta)}</td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </section>

      {/* Usuarios con más transacciones */}
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Usuarios con más transacciones</h2>
            <Button
              variante="secundario"
              onClick={() =>
                exportarExcel(
                  "reporte-usuarios-top",
                  [
                    { titulo: "Usuario", ancho: 24 },
                    { titulo: "Correo", ancho: 30 },
                    { titulo: "Estado", ancho: 12 },
                    { titulo: "Transacciones", ancho: 14 },
                    { titulo: "Volumen", ancho: 16 },
                  ],
                  usuarios.map((u) => [u.nombre, u.correo, u.estado, u.transacciones, u.volumen]),
                )
              }
            >
              <Download className="size-4" aria-hidden /> Excel
            </Button>
          </div>
          <Tabla>
            <thead>
              <tr>
                <th className={th}>#</th>
                <th className={th}>Usuario</th>
                <th className={`${th} text-right`}>Transacciones</th>
                <th className={`${th} text-right`}>Volumen</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr key={u.usuario_id}>
                  <td className={`${td} num text-muted`}>{i + 1}</td>
                  <td className={td}>
                    <p className="font-medium">{u.nombre}</p>
                    <p className="text-xs text-muted">{u.correo}</p>
                  </td>
                  <td className={`${td} num text-right`}>{u.transacciones}</td>
                  <td className={`${td} num text-right`}>{dinero(u.volumen)}</td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        </div>
        <Card>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Ranking gráfico</h2>
          <TopUsuariosBar datos={usuarios.map((u) => ({ nombre: u.nombre, transacciones: u.transacciones }))} />
        </Card>
      </section>
    </div>
  );
}
