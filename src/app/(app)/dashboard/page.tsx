"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSesion } from "@/components/providers";
import { DistribucionPie } from "@/components/charts";
import { PrecioVivo } from "@/components/precio-vivo";
import { Button, Card, Stat, Tabla, Titulo, Vacio, td, th } from "@/components/ui";
import { useCriptos, usePerfil, usePortafolio } from "@/lib/queries";
import { cantidad, dinero, porcentaje } from "@/lib/format";
import { SALDO_INICIAL } from "@/lib/types";
import { colorCripto } from "@/lib/utils";

export default function DashboardPage() {
  const { userId } = useSesion();
  const { data: perfil } = usePerfil(userId);
  const { data: criptos } = useCriptos();
  const { data: portafolio } = usePortafolio(userId);

  if (!perfil || !criptos || !portafolio) {
    return <div className="h-64 animate-pulse rounded-xl bg-surface" aria-label="Cargando portafolio" />;
  }

  const filas = portafolio
    .map((t) => {
      const c = criptos.find((x) => x.id === t.cripto_id);
      return c ? { c, cantidad: t.cantidad, valor: t.cantidad * c.precio_actual } : null;
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .sort((a, b) => b.valor - a.valor);

  const valorCripto = filas.reduce((s, f) => s + f.valor, 0);
  const patrimonio = perfil.saldo + valorCripto;
  const resultado = patrimonio - SALDO_INICIAL;
  const resultadoPct = (resultado / SALDO_INICIAL) * 100;

  return (
    <>
      <Titulo
        titulo="Mi portafolio"
        descripcion="Resumen de tu saldo y tus criptomonedas con precios simulados en vivo."
        acciones={
          <Link href="/mercado">
            <Button>
              Ir al mercado <ArrowRight className="size-4" aria-hidden />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat etiqueta="Saldo disponible" valor={dinero(perfil.saldo)} detalle="Efectivo ficticio" />
        <Stat etiqueta="Valor en criptomonedas" valor={dinero(valorCripto)} detalle={`${filas.length} activo(s)`} />
        <Stat etiqueta="Patrimonio total" valor={dinero(patrimonio)} detalle="Saldo + criptomonedas" />
        <Stat
          etiqueta="Ganancia / pérdida"
          valor={`${resultado >= 0 ? "+" : ""}${dinero(resultado)}`}
          detalle={`${porcentaje(resultadoPct)} vs. saldo inicial de ${dinero(SALDO_INICIAL)}`}
          tono={resultado > 0 ? "up" : resultado < 0 ? "down" : "neutro"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <section aria-labelledby="tit-tenencias">
          <h2 id="tit-tenencias" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Mis tenencias
          </h2>
          {filas.length === 0 ? (
            <Vacio>
              Aún no tienes criptomonedas.{" "}
              <Link href="/mercado" className="font-medium text-accent hover:underline">
                Haz tu primera compra
              </Link>
              .
            </Vacio>
          ) : (
            <Tabla>
              <thead>
                <tr>
                  <th className={th}>Moneda</th>
                  <th className={`${th} text-right`}>Cantidad</th>
                  <th className={`${th} text-right`}>Precio</th>
                  <th className={`${th} text-right`}>Valor</th>
                  <th className={`${th} text-right`}>% del portafolio</th>
                </tr>
              </thead>
              <tbody>
                {filas.map(({ c, cantidad: q, valor }) => (
                  <tr key={c.id} className="hover:bg-surface-2/50">
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: colorCripto(c.simbolo) }} aria-hidden />
                        <span className="font-medium">{c.simbolo}</span>
                        <span className="text-muted">{c.nombre}</span>
                      </span>
                    </td>
                    <td className={`${td} num text-right`}>{cantidad(q)}</td>
                    <td className={`${td} text-right`}>
                      <PrecioVivo valor={c.precio_actual} />
                    </td>
                    <td className={`${td} num text-right font-medium`}>{dinero(valor)}</td>
                    <td className={`${td} num text-right text-muted`}>
                      {valorCripto > 0 ? ((valor / valorCripto) * 100).toFixed(1) : "0.0"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )}
        </section>

        <Card>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Distribución</h2>
          {filas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Sin datos todavía</p>
          ) : (
            <DistribucionPie datos={filas.map((f) => ({ simbolo: f.c.simbolo, valor: Number(f.valor.toFixed(2)) }))} />
          )}
        </Card>
      </div>
    </>
  );
}
