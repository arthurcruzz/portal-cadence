import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth";
import { getObrasDoCompositor } from "@/lib/data";
import TabBar from "@/components/TabBar";
import CatalogoList from "@/components/CatalogoList";

export default async function CatalogoPage() {
  const sessao = await getSessaoAtual();
  if (!sessao) redirect("/");

  const obras = await getObrasDoCompositor(sessao.contato.codigoTitularEcad);

  return (
    <div className="app-shell">
      <div className="topbar">
        <img src="/cadence-logo.png" alt="Cadence" style={{ height: 48 }} />
      </div>

      <div className="content">
        <div className="section-title" style={{ marginTop: 6 }}>
          Suas obras
        </div>

        <CatalogoList obras={obras} />
      </div>

      <TabBar />
    </div>
  );
}
