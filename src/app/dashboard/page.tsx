import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessaoAtual } from "@/lib/auth";
import {
  getFonogramasDoCompositor,
  getFonogramasAgrupadosPorObra,
  getAutorizacoesDoCompositor,
} from "@/lib/data";
import TabBar from "@/components/TabBar";
import CountUp from "@/components/CountUp";

const LINK_SOLICITACAO = "https://solicitacao.cadenceautoral.com.br";

export default async function DashboardPage() {
  const sessao = await getSessaoAtual();
  if (!sessao) redirect("/");

  const codigo = sessao.contato.codigoTitularEcad;
  const [fonogramas, obrasAgrupadas, autorizacoes] = await Promise.all([
    getFonogramasDoCompositor(codigo),
    getFonogramasAgrupadosPorObra(codigo),
    getAutorizacoesDoCompositor(codigo),
  ]);

  const emAndamento = autorizacoes.filter((a) =>
    a.assinaturas.some((s) => s.status === "Aguardando assinatura")
  ).length;
  const novasDescobertas = fonogramas.filter((f) => f.status === "Pendente");
  const confirmadas = fonogramas.filter((f) => f.status === "Confirmado" || f.status === "Original");

  const totalObrasMonitoradas = obrasAgrupadas.length;
  const totalFonogramasConfirmados = obrasAgrupadas.reduce(
    (soma, o) => soma + o.contagem.Original + o.contagem.Confirmado,
    0
  );

  const mensagemWhatsapp = encodeURIComponent(
    `Oi! Pra formalizar a autorização/documentação da música, preenche esse formulário: ${LINK_SOLICITACAO}`
  );

  return (
    <div className="app-shell">
      <div className="topbar">
        <img src="/cadence-logo.png" alt="Cadence" style={{ height: 48 }} />
        <form action="/api/auth/logout" method="post">
          <button
            style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}
          >
            Sair
          </button>
        </form>
      </div>

      <div className="content">
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Bem-vindo de volta</div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 600 }}>
          {sessao.contato.nome}
        </div>

        <div className="hero-card">
          <div className="hero-eyebrow">Catálogo monitorado</div>
          <div className="hero-num">
            <CountUp value={totalObrasMonitoradas} />
          </div>
          <div className="hero-sub">
            <CountUp value={totalFonogramasConfirmados} /> fonogramas encontrados nessas obras
          </div>
        </div>

        <div className="stat-row">
          <Link href="/autorizacoes" className="stat gold" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="n">
              <CountUp value={emAndamento} />
            </div>
            <div className="t">liberações em andamento</div>
          </Link>
          <Link href="/monitorado" className="stat" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="n">
              <CountUp value={novasDescobertas.length} />
            </div>
            <div className="t">regravações novas</div>
          </Link>
          <Link href="/monitorado" className="stat" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="n">
              <CountUp value={confirmadas.length} />
            </div>
            <div className="t">confirmadas</div>
          </Link>
        </div>

        <div className="install-card" style={{ maxWidth: "none", marginTop: 20 }}>
          <strong style={{ fontSize: 12.5 }}>Precisa de uma autorização?</strong>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4, marginBottom: 10 }}>
            Compartilhe o link com o produtor/cantor:
          </div>
          <a
            href={`https://wa.me/?text=${mensagemWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="login-btn"
            style={{
              marginTop: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none",
            }}
          >
            Compartilhar link no WhatsApp
          </a>
        </div>

        {novasDescobertas.length > 0 && (
          <>
            <div className="section-title">Novidades do monitoramento</div>
            {novasDescobertas.map((f) => (
              <Link
                href={`/monitorado?obra=${encodeURIComponent(f.nomeObra)}`}
                className="row-card"
                key={f.isrc}
                style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
              >
                <div className="row-body">
                  <div className="row-title">Nova regravação · {f.nomeObra}</div>
                  <div className="row-sub">{f.interprete}</div>
                </div>
                <span className="badge new">Novo</span>
              </Link>
            ))}
          </>
        )}
      </div>

      <TabBar />
    </div>
  );
}
