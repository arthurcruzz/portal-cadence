"use client";

import { useMemo, useState } from "react";
import type { Obra } from "@/lib/data";

export default function CatalogoList({ obras }: { obras: Obra[] }) {
  const [busca, setBusca] = useState("");
  const [aberta, setAberta] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return obras;
    return obras.filter((o) => o.titulo.toLowerCase().includes(termo));
  }, [busca, obras]);

  return (
    <>
      <input
        className="login-input"
        placeholder="Buscar obra pelo nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {filtradas.map((obra) => {
        const expandido = aberta === obra.titulo;
        return (
          <div key={obra.codObraEcad}>
            <div
              className="row-card"
              style={{ cursor: "pointer" }}
              onClick={() => setAberta(expandido ? null : obra.titulo)}
            >
              <div className="row-body">
                <div className="row-title">{obra.titulo}</div>
                <div className="row-sub">Código ECAD {obra.codObraEcad}</div>
              </div>
              <span className={`badge ${obra.statusEcad === "Confirmado" ? "ok" : "wait"}`}>
                ECAD {obra.statusEcad}
              </span>
            </div>

            {expandido && (
              <div className="status-card" style={{ marginTop: -4 }}>
                <div className="status-sub" style={{ marginBottom: 8 }}>Coautores e participação</div>
                {obra.compositores.map((c) => (
                  <div
                    key={c.codigo}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderTop: "1px solid var(--line)",
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {c.nome}
                      {!c.ehClienteCadence && (
                        <span style={{ fontSize: 9.5, color: "var(--muted)", marginLeft: 6 }}>
                          (fora da Cadence)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--gold-soft)", fontWeight: 700 }}>
                      {c.percentual}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {filtradas.length === 0 && (
        <div style={{ color: "var(--muted)", fontSize: 12.5, marginTop: 8 }}>
          Nenhuma obra encontrada com esse nome.
        </div>
      )}
    </>
  );
}
