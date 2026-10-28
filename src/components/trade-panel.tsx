"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { operarAction } from "@/app/actions/trading";
import { useSesion } from "@/components/providers";
import { Button, Card, Input } from "@/components/ui";
import { usePerfil, usePortafolio } from "@/lib/queries";
import { cantidad as fmtCant, dinero, precio as fmtPrecio } from "@/lib/format";
import type { Cripto } from "@/lib/types";
import { cantidadSchema } from "@/lib/validators";
import { cn } from "@/lib/utils";

const piso8 = (n: number) => Math.floor(n * 1e8) / 1e8;

export function TradePanel({ cripto }: { cripto: Cripto }) {
  const { userId } = useSesion();
  const qc = useQueryClient();
  const { data: perfil } = usePerfil(userId);
  const { data: portafolio } = usePortafolio(userId);
  const [tipo, setTipo] = useState<"compra" | "venta">("compra");
  const [texto, setTexto] = useState("");
  const [pendiente, start] = useTransition();

  const saldo = perfil?.saldo ?? 0;
  const tenencia = portafolio?.find((t) => t.cripto_id === cripto.id)?.cantidad ?? 0;
  const maximo = tipo === "compra" ? piso8(saldo / cripto.precio_actual) : tenencia;

  const n = Number(texto.replace(",", "."));
  const parsed = texto.trim() === "" ? null : cantidadSchema.safeParse(n);
  let error: string | undefined = parsed && !parsed.success ? parsed.error.issues[0]?.message : undefined;
  if (!error && parsed?.success) {
    if (tipo === "compra" && n * cripto.precio_actual > saldo) error = "Saldo insuficiente";
    if (tipo === "venta" && n > tenencia) error = "No tienes tanta cantidad para vender";
  }
  const total = parsed?.success ? n * cripto.precio_actual : 0;
  const puedeEnviar = !!parsed?.success && !error && !pendiente;

  const fijarPorcentaje = (p: number) => setTexto(String(piso8(maximo * p)));

  const enviar = () => {
    if (!puedeEnviar) return;
    start(async () => {
      const r = await operarAction({ criptoId: cripto.id, tipo, cantidad: n });
      if (r.ok) {
        toast.success(
          `${tipo === "compra" ? "Compraste" : "Vendiste"} ${fmtCant(n)} ${cripto.simbolo} por ${dinero(r.total)}`,
        );
        setTexto("");
        qc.invalidateQueries({ queryKey: ["perfil"] });
        qc.invalidateQueries({ queryKey: ["portafolio"] });
      } else {
        toast.error(r.error);
      }
    });
  };

  return (
    <Card className="space-y-4">
      <div role="tablist" aria-label="Tipo de operación" className="grid grid-cols-2 gap-1 rounded-lg bg-bg p-1">
        {(["compra", "venta"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tipo === t}
            onClick={() => {
              setTipo(t);
              setTexto("");
            }}
            className={cn(
              "h-9 rounded-md text-sm font-semibold capitalize transition",
              tipo === t ? (t === "compra" ? "bg-up text-black" : "bg-down text-black") : "text-muted hover:text-fg",
            )}
          >
            {t === "compra" ? "Comprar" : "Vender"}
          </button>
        ))}
      </div>

      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Precio {cripto.simbolo}</dt>
          <dd className="num font-medium">{fmtPrecio(cripto.precio_actual)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">{tipo === "compra" ? "Saldo disponible" : `Tienes`}</dt>
          <dd className="num font-medium">
            {tipo === "compra" ? dinero(saldo) : `${fmtCant(tenencia)} ${cripto.simbolo}`}
          </dd>
        </div>
      </dl>

      <div className="space-y-2">
        <label htmlFor="cantidad" className="text-xs font-medium uppercase tracking-wide text-muted">
          Cantidad ({cripto.simbolo})
        </label>
        <Input
          id="cantidad"
          inputMode="decimal"
          placeholder="0.00"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-invalid={!!error}
          aria-describedby="cantidad-error"
          className="num"
        />
        <div className="grid grid-cols-4 gap-2">
          {[0.25, 0.5, 0.75, 1].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => fijarPorcentaje(p)}
              disabled={maximo <= 0}
              className="h-8 rounded-md border border-line text-xs font-medium text-muted transition hover:border-accent hover:text-accent disabled:opacity-40"
            >
              {p === 1 ? "Máx" : `${p * 100}%`}
            </button>
          ))}
        </div>
        <p id="cantidad-error" role="alert" className="min-h-4 text-xs text-down">
          {error}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-bg px-3 py-2.5 text-sm">
        <span className="text-muted">Total estimado</span>
        <span className="num text-base font-semibold">{dinero(total)}</span>
      </div>

      <Button variante={tipo === "compra" ? "compra" : "venta"} className="w-full" onClick={enviar} disabled={!puedeEnviar}>
        {pendiente ? "Procesando…" : `${tipo === "compra" ? "Comprar" : "Vender"} ${cripto.simbolo}`}
      </Button>
    </Card>
  );
}
