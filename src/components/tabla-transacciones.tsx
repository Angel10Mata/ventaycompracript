"use client";

import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Badge, Button, Tabla, Vacio, td, th } from "@/components/ui";
import { cantidad, dinero, fechaHora, precio } from "@/lib/format";
import { exportarExcel, exportarPDF, type Columna } from "@/lib/export";
import type { Transaccion } from "@/lib/types";

const COLUMNAS: Columna[] = [
  { titulo: "Fecha", ancho: 24 },
  { titulo: "Tipo", ancho: 10 },
  { titulo: "Moneda", ancho: 12 },
  { titulo: "Cantidad", ancho: 16 },
  { titulo: "Precio unitario", ancho: 18 },
  { titulo: "Total", ancho: 16 },
  { titulo: "Saldo posterior", ancho: 18 },
];

const selectCls =
  "h-10 rounded-lg border border-line bg-bg px-3 text-sm text-fg focus:border-accent focus:outline-none";

export function TablaTransacciones({
  filas,
  titulo,
  archivo,
}: {
  filas: Transaccion[];
  titulo: string;
  archivo: string;
}) {
  const [tipo, setTipo] = useState("");
  const [moneda, setMoneda] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const monedas = useMemo(
    () => Array.from(new Set(filas.map((f) => f.criptomonedas?.simbolo).filter(Boolean))) as string[],
    [filas],
  );

  const filtradas = useMemo(
    () =>
      filas.filter((f) => {
        if (tipo && f.tipo !== tipo) return false;
        if (moneda && f.criptomonedas?.simbolo !== moneda) return false;
        const d = f.creado_en.slice(0, 10);
        if (desde && d < desde) return false;
        if (hasta && d > hasta) return false;
        return true;
      }),
    [filas, tipo, moneda, desde, hasta],
  );

  const matriz = () =>
    filtradas.map((f) => [
      fechaHora(f.creado_en),
      f.tipo === "compra" ? "Compra" : "Venta",
      f.criptomonedas?.simbolo ?? "",
      cantidad(f.cantidad),
      precio(f.precio_unitario),
      dinero(f.total),
      dinero(f.saldo_posterior),
    ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-xs text-muted">
          Tipo
          <select className={`${selectCls} block`} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="compra">Compras</option>
            <option value="venta">Ventas</option>
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted">
          Moneda
          <select className={`${selectCls} block`} value={moneda} onChange={(e) => setMoneda(e.target.value)}>
            <option value="">Todas</option>
            {monedas.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted">
          Desde
          <input type="date" className={`${selectCls} block`} value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="space-y-1 text-xs text-muted">
          Hasta
          <input type="date" className={`${selectCls} block`} value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <div className="ml-auto flex gap-2">
          <Button variante="secundario" disabled={!filtradas.length} onClick={() => exportarExcel(archivo, COLUMNAS, matriz())}>
            <Download className="size-4" aria-hidden /> Excel
          </Button>
          <Button variante="secundario" disabled={!filtradas.length} onClick={() => exportarPDF(archivo, titulo, COLUMNAS, matriz())}>
            <FileText className="size-4" aria-hidden /> PDF
          </Button>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <Vacio>No hay transacciones que coincidan.</Vacio>
      ) : (
        <>
          <p className="text-xs text-muted">
            {filtradas.length} transacción{filtradas.length === 1 ? "" : "es"}
          </p>
          <Tabla>
            <thead>
              <tr>
                {["Fecha", "Tipo", "Moneda", "Cantidad", "Precio", "Total", "Saldo posterior"].map((h, i) => (
                  <th key={h} className={`${th} ${i >= 3 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((f) => (
                <tr key={f.id} className="hover:bg-surface-2/50">
                  <td className={`${td} whitespace-nowrap text-muted`}>{fechaHora(f.creado_en)}</td>
                  <td className={td}>
                    <Badge tono={f.tipo === "compra" ? "up" : "down"}>{f.tipo === "compra" ? "Compra" : "Venta"}</Badge>
                  </td>
                  <td className={`${td} font-medium`}>{f.criptomonedas?.simbolo}</td>
                  <td className={`${td} num text-right`}>{cantidad(f.cantidad)}</td>
                  <td className={`${td} num text-right`}>{precio(f.precio_unitario)}</td>
                  <td className={`${td} num text-right font-medium`}>{dinero(f.total)}</td>
                  <td className={`${td} num text-right text-muted`}>{dinero(f.saldo_posterior)}</td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        </>
      )}
    </div>
  );
}
