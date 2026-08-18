import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth";
import { getFonogramasAgrupadosPorObra } from "@/lib/data";
import TabBar from "@/components/TabBar";
import PainelCharts from "@/components/PainelCharts";

export default async function PainelPage() {
  const sessao = await getSessaoAtual();
  if (!sessao) redirect("/");

  const obras = await getFonogramasAgrupadosPorObra(sessao.contato.codigoTitularEcad);

  return (
    <div className="app-shell">
      <div className="topbar">
        <img src="/cadence-logo.png" alt="Cadence" style={{ height: 48 }} />
        <img src="/onda-branca.png" alt="" style={{ height: 14, opacity: 0.5 }} />
      </div>

      <div className="content">
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 4 }}>
          Visão geral do catálogo monitorado, com filtro por obra.
        </div>

        <PainelCharts obras={obras} />
      </div>

      <TabBar />
    </div>
  );
}
