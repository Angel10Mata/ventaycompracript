"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAction } from "@/app/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { Button, Campo, Card, Input } from "@/components/ui";

export default function LoginPage() {
  const [error, setError] = useState<string>();
  const [pendiente, start] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginInput) => {
    setError(undefined);
    start(async () => {
      const r = await loginAction(values);
      if (r?.error) setError(r.error);
    });
  };

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-muted">Entra para ver tu portafolio y operar.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Campo etiqueta="Correo" error={errors.correo?.message}>
          <Input type="email" autoComplete="email" aria-invalid={!!errors.correo} {...register("correo")} />
        </Campo>
        <Campo etiqueta="Contraseña" error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </Campo>

        {error && (
          <p role="alert" className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pendiente}>
          {pendiente ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-accent hover:underline">
          Regístrate
        </Link>
      </p>
    </Card>
  );
}
