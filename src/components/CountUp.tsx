"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({
  value,
  duracaoMs = 700,
  formatador,
}: {
  value: number;
  duracaoMs?: number;
  formatador?: (n: number) => string;
}) {
  const [exibido, setExibido] = useState(0);
  const inicioRef = useRef<number | null>(null);

  useEffect(() => {
    inicioRef.current = null;
    let frameId: number;

    function passo(timestamp: number) {
      if (inicioRef.current === null) inicioRef.current = timestamp;
      const decorrido = timestamp - inicioRef.current;
      const progresso = Math.min(decorrido / duracaoMs, 1);
      // easeOutCubic — começa rápido, desacelera no final
      const suavizado = 1 - Math.pow(1 - progresso, 3);
      setExibido(Math.round(suavizado * value));

      if (progresso < 1) {
        frameId = requestAnimationFrame(passo);
      }
    }

    frameId = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frameId);
  }, [value, duracaoMs]);

  return <>{formatador ? formatador(exibido) : exibido}</>;
}
