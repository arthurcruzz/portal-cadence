"use client";

import { useState } from "react";
import type { ObraMonitorada } from "@/lib/data";

function badgeClasse(status: string) {
  if (status === "Pendente" || status === "Descartado") return "wait";
  return "new";
}

function iniciais(nome: string) {
  return nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function ContagemLine({ contagem }: { contagem: ObraMonitorada["contagem"] }) {
  return (
    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
      Original {contagem.Original} · Confirmado {contagem.Confirmado} · Pendente {contagem.Pendente} · Descartado {contagem.Descartado}
    </div>
  );
}

export default function MonitoradoList({ obras }: { obras: ObraMonitorada[] }) {
  const [aberta, setAberta] = useState<string | null>(null);

  if (obras.length === 0) {
    return <div style={{ color: "var(--muted)", fontSize: 12.5 }}>Nenhum fonograma monitorado ainda.</div>;
  }

  return (
    <>
      {obras.map((o) => {
        const expandido = aberta === o.nomeObra;
        return (
          <div key={o.nomeObra}>
            <div
              className="row-card"
              style={{ cursor: "pointer", alignItems: "flex-start" }}
              onClick={() => setAberta(expandido ? null : o.nomeObra)}
            >
              <div className="row-body">
                <div className="row-title">{o.nomeObra}</div>
                <ContagemLine contagem={o.contagem} />
              </div>
              <span style={{ color: "var(--muted)", fontSize: 14, marginTop: 2 }}>{expandido ? "⌄" : "›"}</span>
            </div>

            {expandido && (
              <div className="status-card" style={{ marginTop: -4 }}>
                <div className="status-title" style={{ marginBottom: 2 }}>{o.nomeObra}</div>
                <ContagemLine contagem={o.contagem} />
                <div style={{ marginTop: 10 }}>
                  {o.fonogramas.map((f) => (
                    <div
                      key={f.isrc}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 0",
                        borderTop: "1px solid var(--line)",
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {iniciais(f.interprete)}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, flex: 1, minWidth: 0 }}>{f.interprete}</div>
                      <span className={`badge ${badgeClasse(f.status)}`}>{f.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
