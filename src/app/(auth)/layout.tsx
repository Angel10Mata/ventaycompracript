import { TrendingUp } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-accent text-black">
          <TrendingUp className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-lg font-semibold leading-none">CryptoSim</p>
          <p className="mt-1 text-xs text-muted">Simulador educativo de criptomonedas</p>
        </div>
      </div>
      {children}
      <p className="mt-8 text-center text-xs text-muted">
        Plataforma con fines educativos. Todo el dinero y los precios son ficticios.
      </p>
    </main>
  );
}
