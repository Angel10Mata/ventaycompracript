import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CryptoSim", template: "%s · CryptoSim" },
  description: "Simulador educativo de compra y venta de criptomonedas con saldo ficticio.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0d13",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
