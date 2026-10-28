"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useHistorialPrecios } from "@/lib/queries";
import { dinero, fechaCorta, hora, precio } from "@/lib/format";
import { colorCripto } from "@/lib/utils";

const EJE = { fill: "#8794ab", fontSize: 11 };
const GRID = "#232d40";
const tooltipStyle = {
  contentStyle: {
    background: "#111722",
    border: "1px solid #232d40",
    borderRadius: 8,
    fontSize: 12,
    color: "#e8ecf4",
  },
  labelStyle: { color: "#8794ab" },
  itemStyle: { color: "#e8ecf4" },
};

function Cargando({ alto }: { alto: number }) {
  return <div className="animate-pulse rounded-lg bg-surface-2" style={{ height: alto }} aria-label="Cargando gráfica" />;
}

/** Serie de precios en vivo de una criptomoneda. */
export function PrecioChart({ criptoId, simbolo, alto = 280 }: { criptoId: number; simbolo: string; alto?: number }) {
  const { data, isLoading } = useHistorialPrecios(criptoId);
  const color = colorCripto(simbolo);
  if (isLoading || !data) return <Cargando alto={alto} />;

  const datos = data.map((p) => ({ t: hora(p.registrado_en), precio: p.precio }));
  const gid = `g-${simbolo}`;

  return (
    <div role="img" aria-label={`Gráfica de precio de ${simbolo}`} style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="t" tick={EJE} tickLine={false} axisLine={false} minTickGap={40} />
          <YAxis
            domain={["auto", "auto"]}
            tick={EJE}
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(v: number) => precio(v)}
          />
          <Tooltip {...tooltipStyle} formatter={(v) => [precio(Number(v)), "Precio"]} />
          <Area type="monotone" dataKey="precio" stroke={color} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Distribución del portafolio por valor en dólares. */
export function DistribucionPie({ datos }: { datos: { simbolo: string; valor: number }[] }) {
  return (
    <div role="img" aria-label="Distribución del portafolio" className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={datos} dataKey="valor" nameKey="simbolo" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none">
            {datos.map((d) => (
              <Cell key={d.simbolo} fill={colorCripto(d.simbolo)} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={(v) => dinero(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#8794ab" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barras comparativas de compras vs ventas por moneda (conteo o volumen). */
export function ComprasVentasBar({
  datos,
  formatoValor,
}: {
  datos: { simbolo: string; compras: number; ventas: number }[];
  formatoValor?: (n: number) => string;
}) {
  return (
    <div role="img" aria-label="Compras y ventas por moneda" className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="simbolo" tick={EJE} tickLine={false} axisLine={false} />
          <YAxis tick={EJE} tickLine={false} axisLine={false} width={64} tickFormatter={formatoValor} allowDecimals={false} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "rgb(255 255 255 / 0.04)" }} formatter={(v) => (formatoValor ? formatoValor(Number(v)) : String(v))} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#8794ab" }} />
          <Bar dataKey="compras" name="Compras" fill="#34d399" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ventas" name="Ventas" fill="#fb7185" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barras horizontales: usuarios con más transacciones. */
export function TopUsuariosBar({ datos }: { datos: { nombre: string; transacciones: number }[] }) {
  const alto = Math.max(160, datos.length * 40 + 40);
  return (
    <div role="img" aria-label="Usuarios con más transacciones" style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={EJE} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="nombre" tick={EJE} tickLine={false} axisLine={false} width={110} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "rgb(255 255 255 / 0.04)" }} />
          <Bar dataKey="transacciones" name="Transacciones" fill="#fbbf24" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Actividad diaria de la plataforma (compras y ventas). */
export function ActividadLinea({ datos }: { datos: { dia: string; compras: number; ventas: number }[] }) {
  const d = datos.map((x) => ({ ...x, etiqueta: fechaCorta(x.dia + "T12:00:00") }));
  return (
    <div role="img" aria-label="Actividad diaria" className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={d} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="etiqueta" tick={EJE} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={EJE} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#8794ab" }} />
          <Line type="monotone" dataKey="compras" name="Compras" stroke="#34d399" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ventas" name="Ventas" stroke="#fb7185" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Evolución del saldo en efectivo tras cada operación. */
export function SaldoLinea({ datos }: { datos: { t: string; saldo: number }[] }) {
  return (
    <div role="img" aria-label="Evolución del saldo" className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="t" tick={EJE} tickLine={false} axisLine={false} minTickGap={40} />
          <YAxis tick={EJE} tickLine={false} axisLine={false} width={72} tickFormatter={(v: number) => dinero(v)} domain={["auto", "auto"]} />
          <Tooltip {...tooltipStyle} formatter={(v) => [dinero(Number(v)), "Saldo"]} />
          <Line type="stepAfter" dataKey="saldo" stroke="#fbbf24" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
