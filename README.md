# CryptoSim — Simulador de compra y venta de criptomonedas

Proyecto final de Desarrollo Web (UMG). Next.js 16 · React 19 · TypeScript · Tailwind 4 · Supabase (Auth + PostgreSQL) · react-hook-form + zod · React Query · Recharts · ExcelJS · jsPDF · SweetAlert2 · pnpm.

## Puesta en marcha
1. Crear un proyecto en Supabase. En Authentication → Providers → Email, desactivar "Confirm email" (para la demo).
2. En el SQL Editor, ejecutar `db/schema.sql` completo.
3. Copiar `.env.example` a `.env.local` y completar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. `pnpm install` y `pnpm dev` (http://localhost:3000).
5. Registrar un usuario y volverlo administrador:
   `update public.profiles set rol='super' where email='tu@correo.com';`

## Comandos
- `pnpm dev` desarrollo · `pnpm build` compilar · `pnpm start` producción

## Estructura
- `db/schema.sql`: tablas, funciones atómicas (comprar_cripto, vender_cripto), RLS y datos iniciales.
- `src/proxy.ts`: protección de rutas por sesión.
- `src/app/actions`: Server Actions (auth, trading, admin) con validación zod.
- `src/app/(app)`: portafolio, mercado, historial, reportes y panel de administración.
- `src/lib`: clientes Supabase, validadores, exportación Excel/PDF, consultas.

## Nota
Los precios se simulan con un recorrido aleatorio que avanza mientras haya alguien con la app abierta.
