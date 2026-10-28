"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registroAction } from "@/app/actions/auth";
import { registroSchema, type RegistroInput } from "@/lib/validators";
import { Button, Campo, Card, Input } from "@/components/ui";
import { dinero } from "@/lib/format";
import { SALDO_INICIAL } from "@/lib/types";

export default function RegistroPage() {
  const [error, setError] = useState<string>();
  const [mensaje, setMensaje] = useState<string>();
  const [pendiente, start] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroInput>({ resolver: zodResolver(registroSchema) });

  const onSubmit = (values: RegistroInput) => {
    setError(undefined);
    start(async () => {
      const r = await registroAction(values);
      if (r?.error) setError(r.error);
      if (r?.mensaje) setMensaje(r.mensaje);
    });
  };

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-semibold">Crear cuenta</h1>
        <p className="mt-1 text-sm text-muted">
          Recibirás <span className="num font-medium text-up">{dinero(SALDO_INICIAL)}</span> ficticios para empezar.
        </p>
      </div>

      {mensaje ? (
        <div className="space-y-3">
          <p role="status" className="rounded-lg border border-up/40 bg-up/10 px-3 py-2 text-sm text-up">
            {mensaje}
          </p>
          <Link href="/login" className="text-sm font-medium text-accent hover:underline">
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Campo etiqueta="Nombre completo" error={errors.nombre?.message}>
            <Input autoComplete="name" aria-invalid={!!errors.nombre} {...register("nombre")} />
          </Campo>
          <Campo etiqueta="Correo" error={errors.correo?.message}>
            <Input type="email" autoComplete="email" aria-invalid={!!errors.correo} {...register("correo")} />
          </Campo>
          <Campo etiqueta="Contraseña" error={errors.password?.message}>
            <Input
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
          </Campo>
          <Campo etiqueta="Confirmar contraseña" error={errors.confirmar?.message}>
            <Input
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmar}
              {...register("confirmar")}
            />
          </Campo>

          {error && (
            <p role="alert" className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pendiente}>
            {pendiente ? "Creando cuenta…" : "Crear cuenta"}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Inicia sesión
        </Link>
      </p>
    </Card>
  );
}
