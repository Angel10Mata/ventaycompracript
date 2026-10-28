import { cn } from "@/lib/utils";
import { evaluarRequisitosPassword } from "@/lib/validators";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type Variante = "primario" | "secundario" | "compra" | "venta" | "peligro" | "fantasma";

const variantes: Record<Variante, string> = {
  primario: "bg-accent text-black hover:brightness-110",
  secundario: "bg-surface-2 text-fg border border-line hover:border-muted/50",
  compra: "bg-up text-black hover:brightness-110",
  venta: "bg-down text-black hover:brightness-110",
  peligro: "bg-down/15 text-down border border-down/40 hover:bg-down/25",
  fantasma: "text-muted hover:text-fg hover:bg-surface-2",
};

export function Button({
  variante = "primario",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        variantes[variante],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-line bg-surface p-5", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-line bg-bg px-3 text-sm text-fg placeholder:text-muted/60",
        "focus:border-accent focus:outline-none aria-[invalid=true]:border-down",
        className,
      )}
      {...props}
    />
  );
}

export function Campo({ etiqueta, error, children }: { etiqueta: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{etiqueta}</span>
      {children}
      {error && (
        <span role="alert" className="block text-xs text-down">
          {error}
        </span>
      )}
    </label>
  );
}

/** Lista de reglas de contraseña (mismas que zod en registro / admin). */
export function RequisitosPassword({ password }: { password: string }) {
  const filas = evaluarRequisitosPassword(password);
  const escribiendo = password.length > 0;

  return (
    <ul className="mt-1.5 space-y-1 text-xs" aria-label="Requisitos de la contraseña">
      {filas.map((r) => (
        <li
          key={r.id}
          className={cn(
            "flex items-start gap-2",
            !escribiendo && "text-muted",
            escribiendo && r.cumple && "text-up",
            escribiendo && !r.cumple && "text-muted",
          )}
        >
          <span className="mt-0.5 shrink-0" aria-hidden>
            {escribiendo ? (r.cumple ? "✓" : "○") : "•"}
          </span>
          <span>{r.etiqueta}</span>
        </li>
      ))}
    </ul>
  );
}

export function Stat({
  etiqueta,
  valor,
  detalle,
  tono = "neutro",
}: {
  etiqueta: string;
  valor: ReactNode;
  detalle?: ReactNode;
  tono?: "neutro" | "up" | "down";
}) {
  return (
    <Card className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{etiqueta}</p>
      <p className={cn("num text-2xl font-semibold", tono === "up" && "text-up", tono === "down" && "text-down")}>
        {valor}
      </p>
      {detalle && <p className="text-xs text-muted">{detalle}</p>}
    </Card>
  );
}

export function Badge({
  tono = "neutro",
  children,
}: {
  tono?: "neutro" | "up" | "down" | "accent";
  children: ReactNode;
}) {
  const t = {
    neutro: "bg-surface-2 text-muted",
    up: "bg-up/15 text-up",
    down: "bg-down/15 text-down",
    accent: "bg-accent/15 text-accent",
  }[tono];
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", t)}>{children}</span>;
}

export function Titulo({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-muted">{descripcion}</p>}
      </div>
      {acciones}
    </div>
  );
}

export function Vacio({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">{children}</div>;
}

export function Tabla({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[640px] text-sm">{children}</table>
    </div>
  );
}

export const th = "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted";
export const td = "px-4 py-3 border-t border-line";
