"use client";

import { useEffect, useRef, useState } from "react";
import { precio } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Muestra un precio y lo resalta brevemente en verde/rojo cuando cambia. */
export function PrecioVivo({ valor, className }: { valor: number; className?: string }) {
  const previo = useRef(valor);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  const [clave, setClave] = useState(0);

  useEffect(() => {
    if (valor !== previo.current) {
      setDir(valor > previo.current ? "up" : "down");
      setClave((k) => k + 1);
      previo.current = valor;
    }
  }, [valor]);

  return (
    <span
      key={clave}
      className={cn("num rounded px-1", dir === "up" && "flash-up", dir === "down" && "flash-down", className)}
    >
      {precio(valor)}
    </span>
  );
}
