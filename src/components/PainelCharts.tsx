"use client";

import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { ObraMonitorada } from "@/lib/data";

const CORES_STATUS: Record<string, string> = {
  Original: "#2E6E8E",
  Confirmado: "#C9A24B",
  Pendente: "#E4C888",
  Descartado: "#e0666b",
};

const tooltipStyle = {
  background: "#152437",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  fontSize: 12,
  color: "#fff",
};

export default function PainelCharts({ obras }: { obras: ObraMonitorada[] }) {
  const [filtro, setFiltro] = useState("Todas as obras");

  const opcoes = ["Todas as obras", ...obras.map((o) => o.nomeObra)];

  const dadosPizza = useMemo(() => {
    const escopo = filtro === "Todas as obras" ? obras : obras.filter((o) => o.nomeObra === filtro);
    const totais = { Original: 0, Confirmado: 0, Pendente: 0, Descartado: 0 };
    for (const o of escopo) {
      totais.Original += o.contagem.Original;
      totais.Confirmado += o.contagem.Confirmado;
      totais.Pendente += o.contagem.Pendente;
      totais.Descartado += o.contagem.Descartado;
    }
    return Object.entries(totais)
      .filter(([, valor]) => valor > 0)
      .map(([nome, value]) => ({ name: nome, value }));
  }, [filtro, obras]);

  const dadosRanking = useMemo(
    () =>
      [...obras]
        .sort((a, b) => b.total - a.total)
        .map((o) => ({ nome: o.nomeObra.length > 14 ? o.nomeObra.slice(0, 13) + "…" : o.nomeObra, total: o.total })),
    [obras]
  );

  const totalFiltro = dadosPizza.reduce((acc, d) => acc + d.value, 0);

  return (
    <>
      <div className="filter-row">
        {opcoes.map((op) => (
          <div
            key={op}
            className={`chip ${filtro === op ? "on" : ""}`}
            onClick={() => setFiltro(op)}
            style={{ cursor: "pointer" }}
          >
            {op}
          </div>
        ))}
      </div>

      <div className="status-card">
        <div className="status-title" style={{ marginBottom: 2 }}>
          Distribuição por status
        </div>
        <div className="status-sub" style={{ marginBottom: 8 }}>
          {filtro} · {totalFiltro} fonograma(s)
        </div>

        {totalFiltro === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 12.5, padding: "20px 0" }}>
            Nenhum fonograma nesse recorte.
          </div>
        ) : (
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {dadosPizza.map((d) => (
                    <Cell key={d.name} fill={CORES_STATUS[d.name]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10, justifyContent: "center" }}>
          {dadosPizza.map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--muted)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: CORES_STATUS[d.name] }} />
              {d.name} ({d.value})
            </div>
          ))}
        </div>
      </div>

      <div className="status-card">
        <div className="status-title" style={{ marginBottom: 2 }}>
          Ranking de obras
        </div>
        <div className="status-sub" style={{ marginBottom: 8 }}>
          Volume de fonogramas encontrados
        </div>

        <div style={{ width: "100%", height: Math.max(160, dadosRanking.length * 34) }}>
          <ResponsiveContainer>
            <BarChart data={dadosRanking} layout="vertical" margin={{ left: 4, right: 12 }}>
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" tick={{ fill: "#8CA0B8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="nome"
                width={90}
                tick={{ fill: "#fff", fontSize: 10.5 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="total" fill="#C9A24B" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
