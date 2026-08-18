// Transforma [["COL_A","COL_B"], ["v1","v2"], ...] em [{COL_A:"v1", COL_B:"v2"}, ...].
// Pula linhas totalmente vazias (comuns no fim de abas do Sheets).
export function linhasParaObjetos(linhas: string[][]): Record<string, string>[] {
  if (linhas.length === 0) return [];
  const [cabecalho, ...dados] = linhas;

  return dados
    .filter((linha) => linha.some((celula) => (celula ?? "").trim() !== ""))
    .map((linha) => {
      const obj: Record<string, string> = {};
      cabecalho.forEach((coluna, i) => {
        obj[coluna.trim()] = (linha[i] ?? "").trim();
      });
      return obj;
    });
}

export function paraNumero(valor: string | undefined): number {
  if (!valor) return 0;
  // Aceita tanto "33,33" (formato BR) quanto "33.33"
  const normalizado = valor.replace(",", ".").replace("%", "").trim();
  const n = parseFloat(normalizado);
  return isNaN(n) ? 0 : n;
}
