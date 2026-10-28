"use client";

import { esAdmin } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  History,
  LayoutDashboard,
  LogOut,
  PieChart,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useSesion } from "@/components/providers";
import { usePerfil } from "@/lib/queries";
import { dinero } from "@/lib/format";
import { cn } from "@/lib/utils";

const ITEMS_USUARIO = [
  { href: "/dashboard", etiqueta: "Portafolio", icono: LayoutDashboard },
  { href: "/mercado", etiqueta: "Mercado", icono: Activity },
  { href: "/historial", etiqueta: "Historial", icono: History },
  { href: "/reportes", etiqueta: "Reportes", icono: PieChart },
];

const ITEMS_ADMIN = [
  { href: "/admin/reportes", etiqueta: "Reportes admin", icono: ShieldCheck },
  { href: "/admin/usuarios", etiqueta: "Usuarios", icono: Users },
  { href: "/admin/auditoria", etiqueta: "Auditoría", icono: ScrollText },
];

function activo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function Enlace({ href, etiqueta, icono: Icono }: (typeof ITEMS_USUARIO)[number]) {
  const pathname = usePathname();
  const on = activo(pathname, href);
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
        on ? "bg-surface-2 text-accent" : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      <Icono className="size-4" aria-hidden />
      {etiqueta}
    </Link>
  );
}

function SaldoChip() {
  const { userId } = useSesion();
  const { data } = usePerfil(userId);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5">
      <Wallet className="size-4 text-accent" aria-hidden />
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wide text-muted">Saldo</p>
        <p className="num text-sm font-semibold">{data ? dinero(data.saldo) : "—"}</p>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { nombre, rol } = useSesion();
  const pathname = usePathname();
  const items = esAdmin(rol) ? [...ITEMS_USUARIO, ...ITEMS_ADMIN] : ITEMS_USUARIO;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface/60 p-4 backdrop-blur lg:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-3 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-black">
            <TrendingUp className="size-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold">CryptoSim</span>
        </Link>

        <nav aria-label="Principal" className="flex-1 space-y-1">
          {ITEMS_USUARIO.map((i) => (
            <Enlace key={i.href} {...i} />
          ))}
          {esAdmin(rol) && (
            <>
              <p className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                Administración
              </p>
              {ITEMS_ADMIN.map((i) => (
                <Enlace key={i.href} {...i} />
              ))}
            </>
          )}
        </nav>

        <div className="space-y-3 border-t border-line pt-4">
          <div className="px-2">
            <p className="truncate text-sm font-medium">{nombre}</p>
            <p className="text-xs capitalize text-muted">{rol}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-surface-2 hover:text-down"
            >
              <LogOut className="size-4" aria-hidden />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Barra superior */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-black">
              <TrendingUp className="size-4" aria-hidden />
            </span>
            <span className="font-semibold">CryptoSim</span>
          </Link>
          <div className="hidden text-sm text-muted lg:block">
            Hola, <span className="font-medium text-fg">{nombre}</span>
          </div>
          <div className="flex items-center gap-2">
            <SaldoChip />
            <form action={logoutAction} className="lg:hidden">
              <button
                type="submit"
                aria-label="Cerrar sesión"
                className="grid size-10 place-items-center rounded-lg border border-line text-muted hover:text-down"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 lg:px-8 lg:pb-10" key={pathname}>
          {children}
        </main>
      </div>

      {/* Navegación inferior (móvil) */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 flex gap-1 overflow-x-auto border-t border-line bg-surface/95 px-2 py-2 backdrop-blur lg:hidden"
      >
        {items.map(({ href, etiqueta, icono: Icono }) => {
          const on = activo(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex min-w-16 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium",
                on ? "text-accent" : "text-muted",
              )}
            >
              <Icono className="size-5" aria-hidden />
              <span className="whitespace-nowrap">{etiqueta.replace(" admin", "")}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
