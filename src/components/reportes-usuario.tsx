"use client";

import { Card, Stat } from "@/components/ui";
import { ComprasVentasBar, DistribucionPie, SaldoLinea } from "@/components/charts";
import { useCriptos, usePerfil, usePortafolio } from "@/lib/queries";
import { dinero, fechaCorta, porcentaje } from "@/lib/format";
import { SALDO_INICIAL, type Transaccion } from "@/lib/types";

/** Balance y gráficas de actividad de un usuario (propio o consultado por el admin). */
export function ReportesUsuario({ userId, transacciones }: { userId: string; transacciones: Transaccion[] }) {
  const { data: perfil } = usePerfil(userId);
  const { data: criptos } = useCriptos();
  const { data: portafolio } = usePortafolio(userId);

  if (!perfil || !criptos || !portafolio) {
    return <div className="h-64 animate-pulse rounded-xl bg-surface" aria-label="Cargando reportes" />;
  }

  const tenencias = portafolio
    .map((t) => {
      const c = criptos.find((x) => x.id === t.cripto_id);
      return c ? { simbolo: c.simbolo, valor: Number((t.cantidad * c.precio_actual).toFixed(2)) } : null;
    })
    .filter((x): x is { simbolo: string; valor: number } => x !== null && x.valor > 0);

  const valorCripto = tenencias.reduce((s, t) => s + t.valor, 0);
  const patrimonio = perfil.saldo + valorCripto;
  const resultado = patrimonio - SALDO_INICIAL;

  // Compras vs ventas por moneda (volumen en USD)
  const porMoneda = new Map<string, { simbolo: string; compras: number; ventas: number }>();
  let totalCompras = 0;
  let totalVentas = 0;
  for (const t of transacciones) {
    const s = t.criptomonedas?.simbolo ?? "?";
    const fila = porMoneda.get(s) ?? { simbolo: s, compras: 0, ventas: 0 };
    if (t.tipo === "compra") {
      fila.compras += t.total;
      totalCompras += t.total;
    } else {
      fila.ventas += t.total;
      totalVentas += t.total;
    }
    porMoneda.set(s, fila);
  }

  // Evolución del saldo (de la más antigua a la más reciente)
  const saldoSerie = [...transacciones]
    .reverse()
    .map((t) => ({ t: fechaCorta(t.creado_en), saldo: t.saldo_posterior }));
  if (saldoSerie.length === 0) saldoSerie.push({ t: "Inicio", saldo: perfil.saldo });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat etiqueta="Saldo en efectivo" valor={dinero(perfil.saldo)} />
        <Stat etiqueta="Valor en criptomonedas" valor={dinero(valorCripto)} />
        <Stat etiqueta="Patrimonio total" valor={dinero(patrimonio)} />
        <Stat
          etiqueta="Resultado"
          valor={`${resultado >= 0 ? "+" : ""}${dinero(resultado)}`}
          detalle={porcentaje((resultado / SALDO_INICIAL) * 100)}
          tono={resultado > 0 ? "up" : resultado < 0 ? "down" : "neutro"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Distribución del portafolio</h2>
          {tenencias.length ? (
            <DistribucionPie datos={tenencias} />
          ) : (
            <p className="py-16 text-center text-sm text-muted">Sin criptomonedas en el portafolio</p>
          )}
        </Card>
        <Card>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Evolución del saldo</h2>
          <SaldoLinea datos={saldoSerie} />
        </Card>
        <Card className="lg:col-span-2">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Volumen de compras y ventas por moneda
            </h2>
            <p className="num text-xs text-muted">
              Total comprado {dinero(totalCompras)} · Total vendido {dinero(totalVentas)} · {transacciones.length}{" "}
              operaciones
            </p>
          </div>
          {porMoneda.size ? (
            <ComprasVentasBar datos={[...porMoneda.values()]} formatoValor={(n) => dinero(n)} />
          ) : (
            <p className="py-16 text-center text-sm text-muted">Aún no hay operaciones</p>
          )}
        </Card>
      </div>
    </div>
  );
}
