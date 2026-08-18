import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessaoAtual } from "@/lib/auth";
import {
  getObrasDoCompositor,
  getFonogramasDoCompositor,
  getAutorizacoesDoCompositor,
} from "@/lib/data";
import TabBar from "@/components/TabBar";

export default async function DashboardPage() {
  const sessao = await getSessaoAtual();
  if (!sessao) redirect("/");

  const codigo = sessao.contato.codigoTitularEcad;
  const [obras, fonogramas, autorizacoes] = await Promise.all([
    getObrasDoCompositor(codigo),
    getFonogramasDoCompositor(codigo),
    getAutorizacoesDoCompositor(codigo),
  ]);

  const emAndamento = autorizacoes.filter((a) =>
    a.assinaturas.some((s) => s.status === "Aguardando assinatura")
  ).length;
  const novasDescobertas = fonogramas.filter((f) => f.status === "Pendente");
  const confirmadas = fonogramas.filter((f) => f.status === "Confirmado" || f.status === "Original");

  return (
    <div className="app-shell">
      <div className="topbar">
        <img src="/cadence-logo.png" alt="Cadence" style={{ height: 32 }} />
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
          <div className="hero-num">{fonogramas.length}</div>
          <div className="hero-sub">fonogramas encontrados em {obras.length} obras</div>
        </div>

        <div className="stat-row">
          <Link href="/autorizacoes" className="stat gold" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="n">{emAndamento}</div>
            <div className="t">liberações em andamento</div>
          </Link>
          <Link href="/monitorado" className="stat" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="n">{novasDescobertas.length}</div>
            <div className="t">regravações novas</div>
          </Link>
          <Link href="/monitorado" className="stat" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="n">{confirmadas.length}</div>
            <div className="t">confirmadas</div>
          </Link>
        </div>

        {novasDescobertas.length > 0 && (
          <>
            <div className="section-title">Novidades do monitoramento</div>
            {novasDescobertas.map((f) => (
              <div className="row-card" key={f.isrc}>
                <div className="row-body">
                  <div className="row-title">Nova regravação · {f.nomeObra}</div>
                  <div className="row-sub">{f.interprete}</div>
                </div>
                <span className="badge new">Novo</span>
              </div>
            ))}
          </>
        )}
      </div>

      <TabBar />
    </div>
  );
}
