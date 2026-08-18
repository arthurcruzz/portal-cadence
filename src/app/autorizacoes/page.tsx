import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth";
import { getAutorizacoesDoCompositor } from "@/lib/data";
import TabBar from "@/components/TabBar";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function dotClass(valor: string) {
  if (valor === "Cadastrado" || valor === "Assinado") return "ok";
  if (valor === "Em andamento") return "mid";
  return "no";
}

export default async function AutorizacoesPage() {
  const sessao = await getSessaoAtual();
  if (!sessao) redirect("/");

  const autorizacoes = await getAutorizacoesDoCompositor(sessao.contato.codigoTitularEcad);

  return (
    <div className="app-shell">
      <div className="topbar">
        <img src="/cadence-logo.png" alt="Cadence" style={{ height: 32 }} />
      </div>

      <div className="content">
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 14 }}>
          Documentos de liberação por obra — status de cadastro e assinaturas. Informativo, sem ação necessária aqui.
        </div>

        {autorizacoes.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 12.5 }}>
            Nenhum processo de liberação em aberto no momento.
          </div>
        )}

        {autorizacoes.map((a) => {
          const todasAssinadas = a.assinaturas.every((s) => s.status === "Assinado");

          return (
            <div className="status-card" key={`${a.nomeObra}-${a.interprete}`}>
              <div className="status-head">
                <div>
                  <div className="status-title" style={{ fontFamily: "Fraunces, serif", fontSize: 15.5 }}>
                    {a.nomeObra}
                  </div>
                  <div className="status-sub">{a.interprete}</div>
                </div>
                <span className={`badge ${todasAssinadas ? "ok" : "wait"}`}>
                  {todasAssinadas ? "Concluído" : "Em andamento"}
                </span>
              </div>

              <div className="status-grid" style={{ marginBottom: 10 }}>
                <div className="status-item">
                  <div className="k">ECAD</div>
                  <div className="v">
                    <span className={`dot ${dotClass(a.ecad)}`}></span>
                    {a.ecad}
                  </div>
                </div>
                <div className="status-item">
                  <div className="k">Digital</div>
                  <div className="v">
                    <span className={`dot ${dotClass(a.digital)}`}></span>
                    {a.digital}
                  </div>
                </div>
              </div>

              {a.assinaturas.map((s) => (
                <div
                  key={s.codigo}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {iniciais(s.nome)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {s.nome}
                      {s.codigo === sessao.contato.codigoTitularEcad ? " (você)" : ""}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>
                      {s.status}
                      {s.data ? ` · ${s.data}` : ""}
                    </div>
                    {s.documentoUrl && (
                      <a
                        href={s.documentoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 10.5,
                          color: "var(--gold-soft)",
                          textDecoration: "underline",
                          marginTop: 2,
                          display: "inline-block",
                        }}
                      >
                        Ver documento assinado →
                      </a>
                    )}
                  </div>
                  <span className={`badge ${s.status === "Assinado" ? "ok" : "wait"}`}>
                    {s.status === "Assinado" ? "✓ OK" : "Pendente"}
                  </span>
                </div>
              ))}

              {a.coautoresExternos.length > 0 && (
                <div
                  style={{
                    fontSize: 10.5,
                    color: "var(--muted)",
                    paddingTop: 8,
                    borderTop: "1px solid var(--line)",
                    marginTop: 2,
                  }}
                >
                  + {a.coautoresExternos.length} coautor(es) fora da administração Cadence
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TabBar />
    </div>
  );
}
