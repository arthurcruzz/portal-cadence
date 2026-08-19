"use client";

import { useState } from "react";
import type { ObraMonitorada } from "@/lib/data";
import CountUp from "./CountUp";

// Valor médio por play, calculado a partir de relatórios reais de royalties
// do catálogo (BMG, Universal, Abramus Digital) — já reflete a fatia média
// recebida por autor em obras com múltiplos coautores (2 a 5), não o valor
// cheio da obra. Ajuste aqui se recalcular com dados mais recentes.
const VALOR_POR_PLAY = 0.001;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function formatarPlays(valor: number): string {
  if (valor >= 1_000_000) return `${(valor / 1_000_000).toFixed(1)}M`;
  if (valor >= 1_000) return `${(valor / 1_000).toFixed(0)}mil`;
  return String(valor);
}

export default function PotencialNaoCapturado({ obras }: { obras: ObraMonitorada[] }) {
  const [aberto, setAberto] = useState(false);

  const fonogramasConfirmados = obras.flatMap((o) => o.fonogramas).filter((f) => f.status === "Confirmado");
  const comPlays = fonogramasConfirmados.filter((f) => f.plays !== null);
  const totalPlays = comPlays.reduce((soma, f) => soma + (f.plays ?? 0), 0);
  const potencial = Math.round(totalPlays * VALOR_POR_PLAY);

  const catalogoCompleto = fonogramasConfirmados.length > 0 && comPlays.length === fonogramasConfirmados.length;

  if (fonogramasConfirmados.length === 0) return null;

  return (
    <div className="potencial-card">
      <div className="potencial-eyebrow">⚠️ Potencial não capturado</div>

      <div className="potencial-valor">
        R$ <CountUp value={potencial} formatador={formatarMoeda} duracaoMs={1000} />
      </div>

      <div className="potencial-sub">
        {comPlays.length} regravações confirmadas · {formatarPlays(totalPlays)} plays
      </div>

      <div className="potencial-texto">
        Essas regravações, além de não autorizadas e sem liberação, já geraram esse
        potencial em plays — e se o ISRC não estiver cadastrado, você não está
        recebendo nada disso hoje.
      </div>

      {!catalogoCompleto && (
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 8, fontStyle: "italic" }}>
          Baseado em {comPlays.length} de {fonogramasConfirmados.length} regravações confirmadas —
          a captura de plays ainda está processando o restante do catálogo.
        </div>
      )}

      <div className="potencial-toggle" onClick={() => setAberto(!aberto)}>
        Como chegamos nesse número? {aberto ? "▴" : "▾"}
      </div>

      {aberto && (
        <div className="potencial-detalhe">
          <strong>Valor médio por play: R$ {VALOR_POR_PLAY.toFixed(3).replace(".", ",")}</strong>
          <br />
          <br />
          Calculado a partir de relatórios reais de royalties do seu próprio catálogo
          (BMG, Universal, Abramus Digital), cruzando o pagamento por play recebido por
          autor em diversas obras — incluindo músicas com 2, 4 e 5 coautores.
          <br />
          <br />
          Como o valor já reflete a fatia média por participação (não o valor cheio da
          obra), o número é conservador e realista, não uma estimativa genérica de
          mercado.
        </div>
      )}
    </div>
  );
}
