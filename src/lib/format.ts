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

const estadoCuenta: Record<string, string> = {
  activo: "activa",
  suspendido: "suspendida",
  baja: "dada de baja",
};

/** Texto legible para la columna Detalle en auditoría (evita JSON crudo). */
export function detalleAuditoria(accion: string, detalle: Record<string, unknown>): string {
  const vacio = !detalle || Object.keys(detalle).length === 0;
  if (vacio) {
    if (accion === "login") return "Inicio de sesión en la plataforma";
    return "—";
  }

  switch (accion) {
    case "compra": {
      const simbolo = String(detalle.simbolo ?? "").trim();
      const c = detalle.cantidad != null ? cantidad(detalle.cantidad as number | string) : "";
      const t = detalle.total != null ? dinero(detalle.total as number | string) : "";
      if (simbolo && c && t) return `Compra de ${c} ${simbolo} por un total de ${t}`;
      break;
    }
    case "venta": {
      const simbolo = String(detalle.simbolo ?? "").trim();
      const c = detalle.cantidad != null ? cantidad(detalle.cantidad as number | string) : "";
      const t = detalle.total != null ? dinero(detalle.total as number | string) : "";
      if (simbolo && c && t) return `Venta de ${c} ${simbolo} por un total de ${t}`;
      break;
    }
    case "registro": {
      const correo = String(detalle.correo ?? "").trim();
      return correo ? `Alta de cuenta con el correo ${correo}` : "Alta de nueva cuenta";
    }
    case "creacion_usuario": {
      const nombre = String(detalle.nombre ?? "").trim();
      const correo = String(detalle.correo ?? "").trim();
      if (nombre && correo) return `Administrador creó la cuenta de ${nombre} (${correo})`;
      if (correo) return `Administrador creó la cuenta ${correo}`;
      return "Creación de cuenta por administrador";
    }
    case "cambio_estado": {
      const raw = String(detalle.estado ?? "");
      const etiqueta = estadoCuenta[raw] ?? raw;
      return etiqueta ? `La cuenta pasó a estado ${etiqueta}` : "Cambio de estado de cuenta";
    }
    default:
      break;
  }

  return Object.entries(detalle)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}
