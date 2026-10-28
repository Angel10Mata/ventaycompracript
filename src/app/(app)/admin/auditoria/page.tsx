import { createClient } from "@/lib/supabase/server";
import { Badge, Tabla, Titulo, Vacio, td, th } from "@/components/ui";
import { fechaHora } from "@/lib/format";
import type { RegistroAuditoria } from "@/lib/types";

export const metadata = { title: "Auditoría" };

const tonos: Record<string, "up" | "down" | "accent" | "neutro"> = {
  compra: "up",
  venta: "down",
  login: "neutro",
  registro: "accent",
  cambio_estado: "accent",
};

export default async function AuditoriaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("auditoria")
    .select("*, profiles(nombre, email)")
    .order("creado_en", { ascending: false })
    .limit(200);

  const filas = (data ?? []) as RegistroAuditoria[];

  return (
    <>
      <Titulo titulo="Auditoría" descripcion="Últimos 200 eventos: registros, inicios de sesión, operaciones y cambios de estado." />
      {filas.length === 0 ? (
        <Vacio>Sin eventos registrados.</Vacio>
      ) : (
        <Tabla>
          <thead>
            <tr>
              <th className={th}>Fecha</th>
              <th className={th}>Usuario</th>
              <th className={th}>Acción</th>
              <th className={th}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className="hover:bg-surface-2/50">
                <td className={`${td} whitespace-nowrap text-muted`}>{fechaHora(f.creado_en)}</td>
                <td className={td}>
                  {f.profiles ? (
                    <>
                      <p className="font-medium">{f.profiles.nombre}</p>
                      <p className="text-xs text-muted">{f.profiles.email}</p>
                    </>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className={td}>
                  <Badge tono={tonos[f.accion] ?? "neutro"}>{f.accion}</Badge>
                </td>
                <td className={`${td} num max-w-md truncate text-xs text-muted`}>
                  {Object.keys(f.detalle ?? {}).length ? JSON.stringify(f.detalle) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      )}
    </>
  );
}
