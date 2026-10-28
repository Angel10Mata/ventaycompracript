const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// Zona horaria fija: evita diferencias entre servidor (UTC) y navegador (hidratación)
const ZONA = "America/Guatemala";

const fFechaHora = new Intl.DateTimeFormat("es-GT", {
  timeZone: ZONA,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const fFechaCorta = new Intl.DateTimeFormat("es-GT", { timeZone: ZONA, day: "2-digit", month: "short" });
const fHora = new Intl.DateTimeFormat("es-GT", {
  timeZone: ZONA,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function dinero(n: number | string): string {
  return usd.format(Number(n));
}

/** Precios: más decimales cuando el valor es pequeño (p. ej. Dogecoin). */
export function precio(n: number | string): string {
  const v = Number(n);
  const dec = v >= 100 ? 2 : v >= 1 ? 3 : 5;
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
}

export function cantidad(n: number | string): string {
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: 8 });
}

export function porcentaje(n: number): string {
  const signo = n > 0 ? "+" : "";
  return `${signo}${n.toFixed(2)}%`;
}

export function fechaHora(iso: string): string {
  return fFechaHora.format(new Date(iso)).replace(",", "");
}

export function fechaCorta(iso: string): string {
  return fFechaCorta.format(new Date(iso));
}

export function hora(iso: string): string {
  return fHora.format(new Date(iso));
}
