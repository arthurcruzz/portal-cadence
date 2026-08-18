// ---------------------------------------------------------------------------
// CAMADA DE DADOS REAL — lê direto da planilha via Google Sheets API.
//
// Nomes de aba e coluna abaixo foram confirmados lendo a planilha real
// (ID em GOOGLE_SHEETS_ID). Ajustes que ainda dependem de confirmação do
// Arthur estão marcados com // ⚠️ ASSUMIDO.
// ---------------------------------------------------------------------------

import { getSheetRows } from "./sheetsClient";
import { linhasParaObjetos, paraNumero } from "./sheetUtils";
import { cache } from "react";

export type ContatoCliente = {
  codigoTitularEcad: string;
  nome: string;
  email: string;
  whatsapp: string;
  ativo: boolean;
};

export type Compositor = {
  codigo: string;
  nome: string;
  percentual: number;
  ehClienteCadence: boolean;
};

export type Obra = {
  codObraEcad: string;
  titulo: string;
  situacao: string;
  statusEcad: "Confirmado" | "Provisório";
  compositores: Compositor[];
};

export type Fonograma = {
  isrc: string;
  nomeObra: string;
  interprete: string;
  album: string;
  ano: string;
  status: "Pendente" | "Confirmado" | "Descartado" | "Original";
  dataConsulta: string;
};

export type AssinaturaCoautor = {
  codigo: string;
  nome: string;
  status: "Assinado" | "Aguardando assinatura";
  data: string | null;
  documentoUrl: string | null;
};

export type AutorizacaoDetalhe = {
  nomeObra: string;
  interprete: string;
  assinaturas: AssinaturaCoautor[]; // sempre coautores administrados pela Cadence
  coautoresExternos: { nome: string; percentual: number }[]; // não administrados
  ecad: "Cadastrado" | "Em andamento" | "Não cadastrado";
  digital: "Cadastrado" | "Em andamento" | "Não cadastrado";
};

// ---------------------------------------------------------------------------
// LEITURA BRUTA DE CADA ABA (cacheada por requisição via Next.js fetch cache
// implícito não se aplica aqui pois é chamada direta à API, não fetch();
// se o tráfego crescer, vale adicionar cache manual com um TTL curto).
// ---------------------------------------------------------------------------

// React cache() memoiza por requisição — mesmo que várias funções chamem
// lerObras() dentro da mesma página, a planilha só é buscada uma vez.
const lerObras = cache(async () => linhasParaObjetos(await getSheetRows("OBRAS")));
const lerObrasTitulares = cache(async () => linhasParaObjetos(await getSheetRows("OBRAS_TITULARES")));
const lerFonogramas = cache(async () => linhasParaObjetos(await getSheetRows("FONOGRAMAS")));
const lerAutorizacoes = cache(async () => linhasParaObjetos(await getSheetRows("AUTORIZACOES")));
const lerCompositoresClientes = cache(async () =>
  linhasParaObjetos(await getSheetRows("COMPOSITORES_CLIENTES"))
);

function normalizaTitulo(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos (á→a, ã→a, ç→c...)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " "); // colapsa espaços duplos
}

function mapStatusCadastro(valor: string): "Cadastrado" | "Em andamento" | "Não cadastrado" {
  const v = (valor ?? "").trim().toUpperCase();
  if (v.includes("CADASTRADO") && !v.includes("NÃO") && !v.includes("NAO")) return "Cadastrado";
  if (v === "" ) return "Não cadastrado";
  return "Em andamento"; // ex: "PENDENTE"
}

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------

export async function findContatoByEmail(email: string): Promise<ContatoCliente | null> {
  const linhas = await lerCompositoresClientes();
  const normalizado = email.trim().toLowerCase();
  const linha = linhas.find((l) => (l.EMAIL ?? "").trim().toLowerCase() === normalizado);
  if (!linha) return null;
  return {
    codigoTitularEcad: linha.CODIGO_TITULAR_ECAD,
    nome: linha.NOME,
    email: linha.EMAIL,
    whatsapp: linha.WHATSAPP,
    ativo: (linha.ATIVO ?? "").trim().toUpperCase() === "SIM",
  };
}

export async function findContatoByCodigo(codigo: string): Promise<ContatoCliente | null> {
  const linhas = await lerCompositoresClientes();
  const linha = linhas.find((l) => l.CODIGO_TITULAR_ECAD === codigo);
  if (!linha) return null;
  return {
    codigoTitularEcad: linha.CODIGO_TITULAR_ECAD,
    nome: linha.NOME,
    email: linha.EMAIL,
    whatsapp: linha.WHATSAPP,
    ativo: (linha.ATIVO ?? "").trim().toUpperCase() === "SIM",
  };
}

// ---------------------------------------------------------------------------
// OBRAS (+ coautores/percentual via OBRAS_TITULARES)
// ---------------------------------------------------------------------------

export const getObrasDoCompositor = cache(async (codigoTitularEcad: string): Promise<Obra[]> => {
  const [obras, titulares, clientes] = await Promise.all([
    lerObras(),
    lerObrasTitulares(),
    lerCompositoresClientes(),
  ]);

  const codigosClientes = new Set(clientes.map((c) => c.CODIGO_TITULAR_ECAD));

  // Códigos de obra em que esse compositor aparece como titular
  const codigosObraDoCompositor = new Set(
    titulares.filter((t) => t.CODIGO_TITULAR_ECAD === codigoTitularEcad).map((t) => t.COD_OBRA_ECAD)
  );

  return obras
    .filter((o) => codigosObraDoCompositor.has(o.COD_OBRA_ECAD))
    .map((o) => {
      const compositoresDaObra = titulares
        .filter((t) => t.COD_OBRA_ECAD === o.COD_OBRA_ECAD)
        .map((t) => ({
          codigo: t.CODIGO_TITULAR_ECAD,
          nome: t.NOME_TITULAR,
          percentual: paraNumero(t.PERCENTUAL),
          ehClienteCadence: codigosClientes.has(t.CODIGO_TITULAR_ECAD),
        }));

      // ⚠️ ASSUMIDO: código ECAD numérico = confirmado; texto (ex: "AGUARDANDO-xxx") = provisório.
      // Confirmar com o Arthur se esse é de fato o critério certo.
      const statusEcad: Obra["statusEcad"] = /^\d+$/.test(o.COD_OBRA_ECAD) ? "Confirmado" : "Provisório";

      return {
        codObraEcad: o.COD_OBRA_ECAD,
        titulo: o["TÍTULO DA OBRA"],
        situacao: o.SITUACAO,
        statusEcad,
        compositores: compositoresDaObra,
      };
    });
});

// ---------------------------------------------------------------------------
// FONOGRAMAS (monitoramento)
// ---------------------------------------------------------------------------

export const getFonogramasDoCompositor = cache(async (codigoTitularEcad: string): Promise<Fonograma[]> => {
  const obras = await getObrasDoCompositor(codigoTitularEcad);
  const titulosNormalizados = new Set(obras.map((o) => normalizaTitulo(o.titulo)));

  const fonogramas = await lerFonogramas();

  return fonogramas
    .filter((f) => titulosNormalizados.has(normalizaTitulo(f["NOME DA OBRA"])))
    .map((f) => ({
      isrc: f.ISRC,
      nomeObra: f["NOME DA OBRA"],
      interprete: f["INTÉRPRETE"] || f["NOME ENCONTRADO"],
      album: f["ÁLBUM"],
      ano: f.ANO,
      status: (f.STATUS as Fonograma["status"]) || "Pendente",
      dataConsulta: f["DATA CONSULTA"],
    }));
});

export type ContagemStatus = { Original: number; Confirmado: number; Pendente: number; Descartado: number };
export type ObraMonitorada = { nomeObra: string; contagem: ContagemStatus; total: number; fonogramas: Fonograma[] };

export const getFonogramasAgrupadosPorObra = cache(async (codigoTitularEcad: string): Promise<ObraMonitorada[]> => {
  const fonogramas = await getFonogramasDoCompositor(codigoTitularEcad);
  const porObra = new Map<string, Fonograma[]>();

  for (const f of fonogramas) {
    const lista = porObra.get(f.nomeObra) ?? [];
    lista.push(f);
    porObra.set(f.nomeObra, lista);
  }

  return Array.from(porObra.entries())
    .map(([nomeObra, lista]) => {
      const contagem: ContagemStatus = { Original: 0, Confirmado: 0, Pendente: 0, Descartado: 0 };
      for (const f of lista) contagem[f.status]++;
      return { nomeObra, contagem, total: lista.length, fonogramas: lista };
    })
    .sort((a, b) => b.total - a.total);
});

// Converte "DD/MM/AAAA" em timestamp pra ordenar por data real (não por texto).
function parseDataBR(data: string | undefined): number {
  if (!data) return 0;
  const [d, m, a] = data.split("/").map((v) => parseInt(v, 10));
  if (!d || !m || !a) return 0;
  return new Date(a, m - 1, d).getTime();
}

// ---------------------------------------------------------------------------
// AUTORIZAÇÕES — agora 1 linha por autor Cadence (ajustado pelo Arthur).
// Agrupamos por (TÍTULO_OBRA + INTÉRPRETE); cada linha do grupo é 1 coautor.
// Quando existem várias liberações ao longo do tempo pro mesmo autor, só a
// mais recente vira o "status atual" — o resto fica de fora por enquanto
// (histórico completo fica pra uma próxima versão).
// Coautores não administrados vêm de OBRAS_TITULARES, sem status de assinatura.
// ---------------------------------------------------------------------------

export const getAutorizacoesDoCompositor = cache(async (codigoTitularEcad: string): Promise<AutorizacaoDetalhe[]> => {
  const [autorizacoes, titulares, obras, clientes] = await Promise.all([
    lerAutorizacoes(),
    lerObrasTitulares(),
    lerObras(),
    lerCompositoresClientes(),
  ]);

  const codigoParaNome = new Map(clientes.map((c) => [c.CODIGO_TITULAR_ECAD, c.NOME]));

  // Grupos (obra+intérprete) em que esse compositor tem pelo menos 1 linha
  const chavesDoCompositor = new Set(
    autorizacoes
      .filter((a) => a.AUTOR_AUTORIZACAO === codigoTitularEcad)
      .map((a) => `${normalizaTitulo(a["TÍTULO_OBRA"])}|||${a["INTÉRPRETE"]}`)
  );

  // Título → código de obra, pra cruzar com OBRAS_TITULARES (coautores externos)
  const tituloParaCodObra = new Map(obras.map((o) => [normalizaTitulo(o["TÍTULO DA OBRA"]), o.COD_OBRA_ECAD]));

  const porGrupo = new Map<string, typeof autorizacoes>();
  for (const a of autorizacoes) {
    const chave = `${normalizaTitulo(a["TÍTULO_OBRA"])}|||${a["INTÉRPRETE"]}`;
    if (!chavesDoCompositor.has(chave)) continue;
    const lista = porGrupo.get(chave) ?? [];
    lista.push(a);
    porGrupo.set(chave, lista);
  }

  const resultado: AutorizacaoDetalhe[] = [];

  for (const [, linhasGrupo] of porGrupo) {
    // Mais recente primeiro dentro do grupo
    const linhas = [...linhasGrupo].sort(
      (a, b) => parseDataBR(b["DATA_LIBERAÇÃO"]) - parseDataBR(a["DATA_LIBERAÇÃO"])
    );

    const primeira = linhas[0];
    const nomeObra = primeira["TÍTULO_OBRA"];
    const interprete = primeira["INTÉRPRETE"];

    // Se o mesmo autor tiver mais de uma liberação (renovação), fica só a
    // mais recente — como já ordenamos por data, o primeiro encontro vale.
    const autoresJaVistos = new Set<string>();
    const assinaturas: AssinaturaCoautor[] = [];
    for (const l of linhas) {
      if (autoresJaVistos.has(l.AUTOR_AUTORIZACAO)) continue;
      autoresJaVistos.add(l.AUTOR_AUTORIZACAO);
      const assinado = (l.ASSINATURA ?? "").trim().toUpperCase() === "OK";
      assinaturas.push({
        codigo: l.AUTOR_AUTORIZACAO,
        nome: codigoParaNome.get(l.AUTOR_AUTORIZACAO) ?? l.AUTOR_AUTORIZACAO,
        status: assinado ? "Assinado" : "Aguardando assinatura",
        data: l["DATA_LIBERAÇÃO"] || null,
        documentoUrl: assinado ? l.LINK_CONTRATO_PDF || null : null,
      });
    }

    const codigosNaAutorizacao = new Set(linhas.map((l) => l.AUTOR_AUTORIZACAO));
    const codObra = tituloParaCodObra.get(normalizaTitulo(nomeObra));
    const coautoresExternos = codObra
      ? titulares
          .filter((t) => t.COD_OBRA_ECAD === codObra && !codigosNaAutorizacao.has(t.CODIGO_TITULAR_ECAD))
          .map((t) => ({ nome: t.NOME_TITULAR, percentual: paraNumero(t.PERCENTUAL) }))
      : [];

    resultado.push({
      nomeObra,
      interprete,
      assinaturas,
      coautoresExternos,
      ecad: mapStatusCadastro(primeira.CADASTRO_ECAD),
      digital: mapStatusCadastro(primeira.CADASTRO_DIGITAL),
      _dataMaisRecente: parseDataBR(primeira["DATA_LIBERAÇÃO"]),
    });
  }

  // Obras com atividade mais recente aparecem primeiro na lista.
  return resultado
    .sort((a, b) => b._dataMaisRecente - a._dataMaisRecente)
    .map(({ _dataMaisRecente, ...resto }) => resto);
});
