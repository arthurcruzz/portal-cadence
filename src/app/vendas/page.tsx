import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth";
import { getVendasDoCompositor } from "@/lib/data";
import TabBar from "@/components/TabBar";
import VendasList from "@/components/VendasList";

export default async function VendasPage() {
  const sessao = await getSessaoAtual();
  if (!sessao) redirect("/");

  const resumo = await getVendasDoCompositor(sessao.contato.codigoTitularEcad);

  return (
    <div className="app-shell">
      <div className="topbar">
        <img src="/cadence-logo.png" alt="Cadence" style={{ height: 48 }} />
      </div>

      <div className="content">
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 16 }}>
          Liberações e exclusividades — resumo financeiro por obra.
        </div>

        <VendasList resumo={resumo} />
      </div>

      <TabBar />
    </div>
  );
}
