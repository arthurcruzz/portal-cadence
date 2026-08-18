import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth";
import { getAutorizacoesDoCompositor } from "@/lib/data";
import TabBar from "@/components/TabBar";
import AutorizacoesList from "@/components/AutorizacoesList";

export default async function AutorizacoesPage() {
  const sessao = await getSessaoAtual();
  if (!sessao) redirect("/");

  const autorizacoes = await getAutorizacoesDoCompositor(sessao.contato.codigoTitularEcad);

  return (
    <div className="app-shell">
      <div className="topbar">
        <img src="/cadence-logo.png" alt="Cadence" style={{ height: 48 }} />
      </div>

      <div className="content">
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 14 }}>
          Documentos de liberação por obra — status de cadastro e assinaturas. Informativo, sem ação necessária aqui.
        </div>

        <AutorizacoesList
          autorizacoes={autorizacoes}
          codigoUsuarioAtual={sessao.contato.codigoTitularEcad}
        />
      </div>

      <TabBar />
    </div>
  );
}
