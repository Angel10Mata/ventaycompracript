"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { cambiarEstadoAction } from "@/app/actions/admin";
import { Badge, Button, Input, Tabla, Vacio, td, th } from "@/components/ui";
import { dinero, fechaHora } from "@/lib/format";
import { cn } from "@/lib/utils";
import { esAdmin, type EstadoCuenta, type Perfil } from "@/lib/types";

export type UsuarioFila = Perfil & { transacciones: number };

const tonoEstado: Record<EstadoCuenta, "up" | "accent" | "down"> = {
  activo: "up",
  suspendido: "accent",
  baja: "down",
};

const textos: Record<EstadoCuenta, { titulo: string; boton: string; ok: string }> = {
  suspendido: { titulo: "¿Suspender esta cuenta?", boton: "Sí, suspender", ok: "Cuenta suspendida" },
  baja: { titulo: "¿Dar de baja esta cuenta?", boton: "Sí, dar de baja", ok: "Cuenta dada de baja" },
  activo: { titulo: "¿Reactivar esta cuenta?", boton: "Sí, reactivar", ok: "Cuenta reactivada" },
};

type ItemMenu = { etiqueta: string; href?: string; peligro?: boolean; onClick?: () => void };

function MenuAccionesUsuario({
  u,
  propio,
  pendiente,
  onCambiar,
}: {
  u: UsuarioFila;
  propio: boolean;
  pendiente: boolean;
  onCambiar: (u: UsuarioFila, estado: EstadoCuenta) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);

  const items: ItemMenu[] = [{ etiqueta: "Ver perfil", href: `/admin/usuarios/${u.id}` }];
  if (!propio) {
    if (u.estado === "activo") {
      items.push({ etiqueta: "Suspender", onClick: () => onCambiar(u, "suspendido") });
    } else {
      items.push({ etiqueta: "Reactivar", onClick: () => onCambiar(u, "activo") });
    }
    if (u.estado !== "baja") {
      items.push({ etiqueta: "Dar de baja", peligro: true, onClick: () => onCambiar(u, "baja") });
    }
  }

  return (
    <div ref={ref} className="relative flex justify-end">
      <Button
        type="button"
        variante="fantasma"
        className="h-8 w-8 shrink-0 px-0"
        aria-label={`Acciones para ${u.nombre}`}
        aria-expanded={abierto}
        aria-haspopup="menu"
        disabled={pendiente}
        onClick={() => setAbierto((v) => !v)}
      >
        <MoreVertical className="size-4" aria-hidden />
      </Button>
      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg"
        >
          {items.map((item) =>
            item.href ? (
              <Link
                key={item.etiqueta}
                href={item.href}
                role="menuitem"
                className="block px-3 py-2 text-sm text-fg hover:bg-surface-2"
                onClick={() => setAbierto(false)}
              >
                {item.etiqueta}
              </Link>
            ) : (
              <button
                key={item.etiqueta}
                type="button"
                role="menuitem"
                disabled={pendiente}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-surface-2 disabled:opacity-50",
                  item.peligro ? "text-down" : "text-fg",
                )}
                onClick={() => {
                  setAbierto(false);
                  item.onClick?.();
                }}
              >
                {item.etiqueta}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function AdminUsuarios({ usuarios, adminId }: { usuarios: UsuarioFila[]; adminId: string }) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"" | EstadoCuenta>("");
  const [pendiente, start] = useTransition();

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return usuarios.filter(
      (u) => (!filtro || u.estado === filtro) && (!t || u.nombre.toLowerCase().includes(t) || u.correo.toLowerCase().includes(t)),
    );
  }, [usuarios, q, filtro]);

  const cambiar = async (u: UsuarioFila, estado: EstadoCuenta) => {
    const t = textos[estado];
    const r = await Swal.fire({
      title: t.titulo,
      text: `${u.nombre} (${u.correo})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t.boton,
      cancelButtonText: "Cancelar",
      background: "#111722",
      color: "#e8ecf4",
      confirmButtonColor: estado === "activo" ? "#34d399" : "#fb7185",
    });
    if (!r.isConfirmed) return;

    start(async () => {
      const res = await cambiarEstadoAction({ usuarioId: u.id, estado });
      if (res.ok) toast.success(t.ok);
      else toast.error(res.error ?? "No se pudo actualizar");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="min-w-56 flex-1">
          <Input
            placeholder="Buscar por nombre o correo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar usuarios"
          />
        </div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as "" | EstadoCuenta)}
          aria-label="Filtrar por estado"
          className="h-11 rounded-lg border border-line bg-bg px-3 text-sm focus:border-accent focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="suspendido">Suspendidos</option>
          <option value="baja">De baja</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <Vacio>No se encontraron usuarios.</Vacio>
      ) : (
        <Tabla>
          <thead>
            <tr>
              <th className={th}>Usuario</th>
              <th className={th}>Estado</th>
              <th className={`${th} text-right`}>Saldo</th>
              <th className={`${th} text-right`}>Transacciones</th>
              <th className={th}>Registro</th>
              <th className={`${th} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => {
              const propio = u.id === adminId || esAdmin(u.rol);
              return (
                <tr key={u.id} className="hover:bg-surface-2/50">
                  <td className={td}>
                    <p className="font-medium">
                      {u.nombre} {esAdmin(u.rol) && <Badge tono="accent">admin</Badge>}
                    </p>
                    <p className="text-xs text-muted">{u.correo}</p>
                  </td>
                  <td className={td}>
                    <Badge tono={tonoEstado[u.estado]}>{u.estado}</Badge>
                  </td>
                  <td className={`${td} num text-right`}>{dinero(u.saldo)}</td>
                  <td className={`${td} num text-right`}>{u.transacciones}</td>
                  <td className={`${td} whitespace-nowrap text-muted`}>{fechaHora(u.creado_en)}</td>
                  <td className={td}>
                    <MenuAccionesUsuario u={u} propio={propio} pendiente={pendiente} onCambiar={cambiar} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Tabla>
      )}
    </div>
  );
}
