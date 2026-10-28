"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { crearUsuarioAction } from "@/app/actions/admin";
import { Button, Campo, Card, Input, RequisitosPassword } from "@/components/ui";
import { dinero } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SALDO_INICIAL } from "@/lib/types";
import { crearUsuarioAdminSchema, type CrearUsuarioAdminInput } from "@/lib/validators";

export function AdminCrearUsuario() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, start] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CrearUsuarioAdminInput>({ resolver: zodResolver(crearUsuarioAdminSchema) });

  const password = watch("password") ?? "";

  const onSubmit = (values: CrearUsuarioAdminInput) => {
    start(async () => {
      const r = await crearUsuarioAction(values);
      if (r.ok) {
        toast.success(r.mensaje ?? "Usuario creado");
        reset();
        setAbierto(false);
        router.refresh();
      } else {
        toast.error(r.error ?? "No se pudo crear el usuario");
      }
    });
  };

  return (
    <Card className="mb-6 space-y-0 p-0 overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-surface-2/50"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        <span className="flex items-center gap-2 font-semibold">
          <UserPlus className="size-5 text-accent" aria-hidden />
          Crear usuario
        </span>
        <ChevronDown className={cn("size-5 text-muted transition", abierto && "rotate-180")} aria-hidden />
      </button>

      {abierto && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-t border-line px-5 py-5" noValidate>
          <p className="text-sm text-muted">
            Se registra en Supabase Auth y, automáticamente, en <span className="text-fg">profiles</span> y{" "}
            <span className="text-fg">billeteras</span> con{" "}
            <span className="num font-medium text-up">{dinero(SALDO_INICIAL)}</span> de saldo inicial.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre completo" error={errors.nombre?.message}>
              <Input autoComplete="off" aria-invalid={!!errors.nombre} {...register("nombre")} />
            </Campo>
            <Campo etiqueta="Correo" error={errors.correo?.message}>
              <Input type="email" autoComplete="off" aria-invalid={!!errors.correo} {...register("correo")} />
            </Campo>
            <div className="sm:col-span-2">
              <Campo etiqueta="Contraseña" error={errors.password?.message}>
                <Input
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  aria-describedby="requisitos-password-admin"
                  {...register("password")}
                />
                <div id="requisitos-password-admin">
                  <RequisitosPassword password={password} />
                </div>
              </Campo>
            </div>
            <Campo etiqueta="Confirmar contraseña" error={errors.confirmar?.message}>
              <Input
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmar}
                {...register("confirmar")}
              />
            </Campo>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variante="secundario" disabled={pendiente} onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendiente}>
              {pendiente ? "Creando…" : "Crear usuario"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
