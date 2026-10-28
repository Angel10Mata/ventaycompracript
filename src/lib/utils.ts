import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Colores de marca por símbolo, usados en gráficas y chips. */
export const COLOR_CRIPTO: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#8c9eff",
  DOGE: "#e5c04b",
  SOL: "#19d3a2",
};

export function colorCripto(simbolo: string): string {
  return COLOR_CRIPTO[simbolo] ?? "#7dd3fc";
}
