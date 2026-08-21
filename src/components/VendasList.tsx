import type { ResumoVendas } from "@/lib/data";

function formatarMoeda(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default function VendasList({ resumo }: { resumo: ResumoVendas }) {
  return (
    <>
      <div
        style={{
          background: "linear-gradient(135deg, var(--steel) 0%, var(--navy-2) 100%)",
          borderRadius: 16,
          padding: 18,
          marginBottom: 8,
          border: "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>Liberações</div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600 }}>
            {formatarMoeda(resumo.totalLiberacoes)}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>Exclusividades</div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600 }}>
            {formatarMoeda(resumo.totalExclusividades)}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            marginTop: 6,
            paddingTop: 12,
          }}
        >
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>Total {resumo.ano}</div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600, color: "var(--gold-soft)" }}>
            {formatarMoeda(resumo.totalGeral)}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic", lineHeight: 1.5, margin: "10px 0 20px" }}>
        Somatória do ano corrente. O valor considera o total recebido pela música, sem separar a fatia do autor.
      </div>

      {resumo.exclusividadesAtivas.length > 0 && (
        <>
          <div className="section-title">⏳ Exclusividades ativas</div>
          {resumo.exclusividadesAtivas.map((c, i) => {
            const perto = (c.diasRestantes ?? 999) <= 30;
            return (
              <div
                key={`${c.nomeObra}-${i}`}
                className="status-card"
                style={{ borderColor: "rgba(201,162,75,0.4)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 14.5, fontWeight: 600 }}>{c.nomeObra}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-soft)", whiteSpace: "nowrap" }}>
                    {formatarMoeda(c.valor)}
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 10.5, color: "var(--muted)", alignItems: "center" }}>
                  <span className="badge wait">Exclusividade</span>
                  <span className={`badge ${perto ? "wait" : "ok"}`}>
                    acaba em {c.diasRestantes} dias
                  </span>
                  <span>· Liberado em {c.dataLiberacao}</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {resumo.liberacoesDoAno.length > 0 && (
        <>
          <div className="section-title">✓ Liberações — {resumo.ano}</div>
          {resumo.liberacoesDoAno.map((c, i) => (
            <div key={`${c.nomeObra}-${i}`} className="status-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 14.5, fontWeight: 600 }}>{c.nomeObra}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-soft)", whiteSpace: "nowrap" }}>
                  {formatarMoeda(c.valor)}
                </div>
              </div>
              <div style={{ fontSize: 10.5, color: "var(--muted)" }}>
                <span className="badge ok">Liberação</span> · Liberado em {c.dataLiberacao}
              </div>
            </div>
          ))}
        </>
      )}

      {resumo.exclusividadesAtivas.length === 0 && resumo.liberacoesDoAno.length === 0 && (
        <div style={{ color: "var(--muted)", fontSize: 12.5 }}>Nenhum contrato encontrado.</div>
      )}
    </>
  );
}
