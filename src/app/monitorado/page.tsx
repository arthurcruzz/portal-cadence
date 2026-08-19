import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessaoAtual } from "@/lib/auth";
import { getFonogramasAgrupadosPorObra } from "@/lib/data";
import TabBar from "@/components/TabBar";
import MonitoradoList from "@/components/MonitoradoList";
import LoadingWave from "@/components/LoadingWave";

export default async function MonitoradoPage() {
  const sessao = await getSessaoAtual();
  if (!sessao) redirect("/");

  const obrasAgrupadas = await getFonogramasAgrupadosPorObra(sessao.contato.codigoTitularEcad);

  return (
    <div className="app-shell">
      <div className="topbar">
        <img src="/cadence-logo.png" alt="Cadence" style={{ height: 48 }} />
      </div>

      <div className="content">
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 4 }}>
          Gravações encontradas pelo monitoramento, agrupadas por obra — tabela Fonogramas.
        </div>

        <Suspense fallback={<LoadingWave />}>
          <MonitoradoList obras={obrasAgrupadas} />
        </Suspense>
      </div>

      <TabBar />
    </div>
  );
}
