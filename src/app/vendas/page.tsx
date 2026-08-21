import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth";
import { getVendasDoCompositor, getDiagnosticoVendas } from "@/lib/data";
import TabBar from "@/components/TabBar";
import VendasList from "@/components/VendasList";

export default async function VendasPage() {
  const sessao = await getSessaoAtual();
  if (!sessao) redirect("/");

  const codigo = sessao.contato.codigoTitularEcad;
  const [resumo, diagnostico] = await Promise.all([
    getVendasDoCompositor(codigo),
    getDiagnosticoVendas(codigo),
  ]);

  return (
    <div className="app-shell">
      <div className="topbar">
        <img src="/cadence-logo.png" alt="Cadence" style={{ height: 48 }} />
      </div>

      <div className="content">
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 16 }}>
          Liberações e exclusividades — resumo financeiro por obra.
        </div>

        <div
          style={{
            background: "#1a1005",
            border: "1px solid #C9A24B",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            fontSize: 11,
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <strong style={{ color: "#C9A24B" }}>DIAGNÓSTICO (remover depois)</strong>
          {"\n\n"}
          {JSON.stringify(diagnostico, null, 2)}
        </div>

        <VendasList resumo={resumo} />
      </div>

      <TabBar />
    </div>
  );
}
