"use client";

import { useState } from "react";
import { PrecioChart } from "@/components/charts";
import { PrecioVivo } from "@/components/precio-vivo";
import { TradePanel } from "@/components/trade-panel";
import { Card, Titulo } from "@/components/ui";
import { useCriptos } from "@/lib/queries";
import { porcentaje } from "@/lib/format";
import { cn, colorCripto } from "@/lib/utils";

export default function MercadoPage() {
  const { data: criptos } = useCriptos();
  const [sel, setSel] = useState<number>();

  if (!criptos) return <div className="h-64 animate-pulse rounded-xl bg-surface" aria-label="Cargando mercado" />;

  const actual = criptos.find((c) => c.id === sel) ?? criptos[0];
  if (!actual) return <p className="text-sm text-muted">No hay criptomonedas disponibles.</p>;

  return (
    <>
      <Titulo
        titulo="Mercado"
        descripcion="Los precios se simulan y cambian cada pocos segundos. Elige una moneda para operar."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {criptos.map((c) => {
          const delta = ((c.precio_actual - c.precio_base) / c.precio_base) * 100;
          const on = c.id === actual.id;
          return (
            <button
              key={c.id}
              onClick={() => setSel(c.id)}
              aria-pressed={on}
              className={cn(
                "rounded-xl border bg-surface p-4 text-left transition",
                on ? "border-accent" : "border-line hover:border-muted/50",
              )}
            >
              <span className="flex items-center gap-2 text-sm">
                <span className="size-2.5 rounded-full" style={{ background: colorCripto(c.simbolo) }} aria-hidden />
                <span className="font-semibold">{c.simbolo}</span>
                <span className="truncate text-muted">{c.nombre}</span>
              </span>
              <span className="mt-2 block text-lg font-semibold">
                <PrecioVivo valor={c.precio_actual} />
              </span>
              <span className={cn("num text-xs", delta >= 0 ? "text-up" : "text-down")}>
                {porcentaje(delta)} <span className="text-muted">vs. base</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold">
              {actual.nombre} <span className="text-muted">({actual.simbolo}/USD)</span>
            </h2>
            <span className="text-xs text-muted">Últimas 60 muestras</span>
          </div>
          <PrecioChart criptoId={actual.id} simbolo={actual.simbolo} />
        </Card>
        <TradePanel cripto={actual} />
      </div>
    </>
  );
}
