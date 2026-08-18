import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessaoAtual } from "@/lib/auth";
import {
  getFonogramasDoCompositor,
  getFonogramasAgrupadosPorObra,
  getAutorizacoesDoCompositor,
} from "@/lib/data";
import TabBar from "@/components/TabBar";

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

  // Card principal: quantidade de OBRAS com pelo menos 1 fonograma encontrado
  // (agrupado, igual à aba Monitorado) — não a contagem crua de linhas.
  const totalObrasMonitoradas = obrasAgrupadas.length;

  // Só conta Original + Confirmado — Pendente e Descartado ainda não são
  // certeza, então não entram nesse número de destaque.
  const totalFonogramasConfirmados = obrasAgrupadas.reduce(
    (soma, o) => soma + o.contagem.Original + o.contagem.Confirmado,
    0
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
          <div className="hero-num">{totalObrasMonitoradas}</div>
          <div className="hero-sub">
            {totalFonogramasConfirmados} fonogramas encontrados nessas obras
          </div>
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
