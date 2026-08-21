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
  linkSpotify: string;
  plays: number | null; // preenchido pelo script scraper-plays-spotify; null = ainda não processado
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
// FONOGRAMAS tem uma linha de título decorativo antes do cabeçalho de
// verdade — a linha 1 é só um título, o cabeçalho real está na linha 2.
// Por isso pulamos a primeira linha antes de processar.
const lerFonogramas = cache(async () => {
  const linhas = await getSheetRows("FONOGRAMAS");
  return linhasParaObjetos(linhas.slice(1));
});
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
//
// IMPORTANTE: agrupamos por TÍTULO normalizado, não por código ECAD. A mesma
// música pode ter mais de um código ao longo do tempo (ex: renovações que
// geram um novo código provisório "AGUARDANDO-xxx" a cada solicitação) — se
// agrupássemos por código, a mesma música apareceria várias vezes.
// ---------------------------------------------------------------------------

export const getObrasDoCompositor = cache(async (codigoTitularEcad: string): Promise<Obra[]> => {
  const [obras, titulares, clientes] = await Promise.all([
    lerObras(),
    lerObrasTitulares(),
    lerCompositoresClientes(),
  ]);

  const codigosClientes = new Set(clientes.map((c) => c.CODIGO_TITULAR_ECAD));
  const obraPorCodigo = new Map(obras.map((o) => [o.COD_OBRA_ECAD, o]));

  const titularesDoCompositor = titulares.filter((t) => t.CODIGO_TITULAR_ECAD === codigoTitularEcad);

  // Agrupa as linhas de titularidade desse compositor por título normalizado
  const porTitulo = new Map<string, typeof titularesDoCompositor>();
  for (const t of titularesDoCompositor) {
    const chave = normalizaTitulo(t.TITULO_OBRA);
    const lista = porTitulo.get(chave) ?? [];
    lista.push(t);
    porTitulo.set(chave, lista);
  }

  const resultado: Obra[] = [];

  for (const [, linhas] of porTitulo) {
    // Entre os códigos possíveis pra essa música, prefere um código ECAD
    // numérico (confirmado) a um provisório ("AGUARDANDO-xxx").
    const codigosPossiveis = Array.from(new Set(linhas.map((l) => l.COD_OBRA_ECAD)));
    const codigoEscolhido =
      codigosPossiveis.find((c) => /^\d+$/.test(c)) ?? codigosPossiveis[0];

    const linhaBase = linhas.find((l) => l.COD_OBRA_ECAD === codigoEscolhido) ?? linhas[0];
    const obraNaTabela = obraPorCodigo.get(codigoEscolhido);

    // Todos os coautores dessa música (qualquer código associado a ela)
    const compositoresDaObra = titulares
      .filter((t) => codigosPossiveis.includes(t.COD_OBRA_ECAD))
      .reduce((acc, t) => {
        if (acc.some((c) => c.codigo === t.CODIGO_TITULAR_ECAD)) return acc; // já entrou
        acc.push({
          codigo: t.CODIGO_TITULAR_ECAD,
          nome: t.NOME_TITULAR,
          percentual: paraNumero(t.PERCENTUAL),
          ehClienteCadence: codigosClientes.has(t.CODIGO_TITULAR_ECAD),
        });
        return acc;
      }, [] as Compositor[]);

    // ⚠️ ASSUMIDO: código ECAD numérico = confirmado; texto (ex: "AGUARDANDO-xxx") = provisório.
    const statusEcad: Obra["statusEcad"] = /^\d+$/.test(codigoEscolhido) ? "Confirmado" : "Provisório";

    resultado.push({
      codObraEcad: codigoEscolhido,
      titulo: obraNaTabela?.["TÍTULO DA OBRA"] ?? linhaBase.TITULO_OBRA,
      situacao: obraNaTabela?.SITUACAO ?? "",
      statusEcad,
      compositores: compositoresDaObra,
    });
  }

  return resultado;
});

// ---------------------------------------------------------------------------
// FONOGRAMAS (monitoramento)
//
// Cruza direto com OBRAS_TITULARES (TITULO_OBRA), sem depender do elo com a
// tabela OBRAS — assim, mesmo que uma obra não tenha código ECAD linkado
// corretamente na tabela OBRAS, seus fonogramas ainda aparecem.
// ---------------------------------------------------------------------------

export const getFonogramasDoCompositor = cache(async (codigoTitularEcad: string): Promise<Fonograma[]> => {
  const titulares = await lerObrasTitulares();
  const titulosNormalizados = new Set(
    titulares
      .filter((t) => t.CODIGO_TITULAR_ECAD === codigoTitularEcad)
      .map((t) => normalizaTitulo(t.TITULO_OBRA))
  );

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
      linkSpotify: f["LINK SPOTIFY"],
      plays: (() => {
        const bruto = (f["PLAYS_SPOTIFY"] ?? "").trim();
        if (bruto === "" || bruto === "N/D") return null; // vazio = ainda não processado; N/D = Spotify não expõe esse número
        const n = parseInt(bruto, 10);
        return isNaN(n) ? null : n;
      })(),
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

export type ContratoLiberacao = {
  nomeObra: string;
  interprete: string;
  tipoLiberacao: string; // "Liberação" ou "Exclusividade"
  valor: number;
  dataLiberacao: string;
  diasRestantes: number | null; // só preenchido pra Exclusividade
};

export type ResumoVendas = {
  totalLiberacoes: number;
  totalExclusividades: number;
  totalGeral: number;
  ano: number;
  exclusividadesAtivas: ContratoLiberacao[]; // todas, independente do ano — ordenadas por vencer primeiro
  liberacoesDoAno: ContratoLiberacao[];
};

function parseDataBRparaDate(data: string): Date | null {
  const [d, m, a] = (data ?? "").split("/").map((v) => parseInt(v, 10));
  if (!d || !m || !a) return null;
  return new Date(a, m - 1, d);
}

function extrairMeses(periodo: string): number | null {
  const match = (periodo ?? "").match(/(\d+)\s*MESES?/i);
  return match ? parseInt(match[1], 10) : null;
}

// ---------------------------------------------------------------------------
// VENDAS — liberações e exclusividades: totais do ano corrente (por tipo),
// e a lista de exclusividades ativas (independente do ano) + liberações do
// ano. Só os contratos em que esse compositor é o autor da autorização.
// ---------------------------------------------------------------------------
export const getVendasDoCompositor = cache(async (codigoTitularEcad: string): Promise<ResumoVendas> => {
  const autorizacoes = await lerAutorizacoes();
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();

  const contratos: ContratoLiberacao[] = autorizacoes
    .filter((a) => a.AUTOR_AUTORIZACAO === codigoTitularEcad)
    .map((a) => {
      const tipoRaw = (a["TIPO_LIBERAÇÃO"] || "").trim().toUpperCase();
      // "SEM EXCLUSIVIDADE" contém a palavra "EXCLUSIV" — por isso checamos
      // "SEM" primeiro. Só entra como Exclusividade se NÃO começar com "SEM".
      const ehExclusividade = tipoRaw.includes("EXCLUSIV") && !tipoRaw.startsWith("SEM");
      const dataLiberacao = a["DATA_LIBERAÇÃO"] || "";
      let diasRestantes: number | null = null;

      if (ehExclusividade) {
        const dataInicio = parseDataBRparaDate(dataLiberacao);
        const meses = extrairMeses(a["PERÍODO"] || "");
        if (dataInicio && meses !== null) {
          const dataFim = new Date(dataInicio);
          dataFim.setMonth(dataFim.getMonth() + meses);
          diasRestantes = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        nomeObra: a["TÍTULO_OBRA"],
        interprete: a["INTÉRPRETE"],
        tipoLiberacao: ehExclusividade ? "Exclusividade" : "Liberação",
        valor: paraNumero(a.VALOR),
        dataLiberacao,
        diasRestantes,
      };
    })
    .filter((c) => c.valor > 0);


  const doAnoAtual = contratos.filter((c) => {
    const d = parseDataBRparaDate(c.dataLiberacao);
    return d && d.getFullYear() === anoAtual;
  });

  const totalLiberacoes = doAnoAtual
    .filter((c) => c.tipoLiberacao === "Liberação")
    .reduce((soma, c) => soma + c.valor, 0);
  const totalExclusividades = doAnoAtual
    .filter((c) => c.tipoLiberacao === "Exclusividade")
    .reduce((soma, c) => soma + c.valor, 0);

  const exclusividadesAtivas = contratos
    .filter((c) => c.tipoLiberacao === "Exclusividade" && c.diasRestantes !== null && c.diasRestantes >= 0)
    .sort((a, b) => (a.diasRestantes ?? 0) - (b.diasRestantes ?? 0));

  const liberacoesDoAno = doAnoAtual
    .filter((c) => c.tipoLiberacao === "Liberação")
    .sort((a, b) => (parseDataBRparaDate(b.dataLiberacao)?.getTime() ?? 0) - (parseDataBRparaDate(a.dataLiberacao)?.getTime() ?? 0));

  return {
    totalLiberacoes,
    totalExclusividades,
    totalGeral: totalLiberacoes + totalExclusividades,
    ano: anoAtual,
    exclusividadesAtivas,
    liberacoesDoAno,
  };
});



export const getAutorizacoesDoCompositor = cache(async (codigoTitularEcad: string): Promise<AutorizacaoDetalhe[]> => {
  const [autorizacoes, titulares, clientes] = await Promise.all([
    lerAutorizacoes(),
    lerObrasTitulares(),
    lerCompositoresClientes(),
  ]);

  const codigoParaNome = new Map(clientes.map((c) => [c.CODIGO_TITULAR_ECAD, c.NOME]));

  // Grupos (obra+intérprete) em que esse compositor tem pelo menos 1 linha
  const chavesDoCompositor = new Set(
    autorizacoes
      .filter((a) => a.AUTOR_AUTORIZACAO === codigoTitularEcad)
      .map((a) => `${normalizaTitulo(a["TÍTULO_OBRA"])}|||${a["INTÉRPRETE"]}`)
  );

  const porGrupo = new Map<string, typeof autorizacoes>();
  for (const a of autorizacoes) {
    const chave = `${normalizaTitulo(a["TÍTULO_OBRA"])}|||${a["INTÉRPRETE"]}`;
    if (!chavesDoCompositor.has(chave)) continue;
    const lista = porGrupo.get(chave) ?? [];
    lista.push(a);
    porGrupo.set(chave, lista);
  }

  // Array intermediário com o campo extra de ordenação — removido no final,
  // antes de retornar como AutorizacaoDetalhe[] "oficial".
  const resultado: (AutorizacaoDetalhe & { _dataMaisRecente: number })[] = [];

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
    // Coautores externos: qualquer linha de OBRAS_TITULARES com o mesmo
    // título (comparado sem acento/maiúsculas) que não está entre quem já
    // aparece nessa autorização.
    const tituloNormalizadoObra = normalizaTitulo(nomeObra);
    const coautoresExternos = titulares
      .filter(
        (t) =>
          normalizaTitulo(t.TITULO_OBRA) === tituloNormalizadoObra &&
          !codigosNaAutorizacao.has(t.CODIGO_TITULAR_ECAD)
      )
      .reduce((acc, t) => {
        if (acc.some((c) => c.nome === t.NOME_TITULAR)) return acc;
        acc.push({ nome: t.NOME_TITULAR, percentual: paraNumero(t.PERCENTUAL) });
        return acc;
      }, [] as { nome: string; percentual: number }[]);

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
