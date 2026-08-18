import { google } from "googleapis";

// ---------------------------------------------------------------------------
// Autenticação via Service Account (só leitura). As credenciais vêm de
// variáveis de ambiente — nunca ficam no código. Configurar no Vercel em
// Settings → Environment Variables:
//   GOOGLE_SHEETS_ID
//   GOOGLE_SERVICE_ACCOUNT_EMAIL
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
// ---------------------------------------------------------------------------

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // A chave privada, quando colada como variável de ambiente, geralmente
  // vem com \n literais em vez de quebras de linha reais — convertemos aqui.
  const key = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error(
      "Variáveis GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY não configuradas."
    );
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

// Busca todas as linhas de uma aba (incluindo o cabeçalho na posição 0).
export async function getSheetRows(nomeAba: string): Promise<string[][]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    throw new Error("Variável GOOGLE_SHEETS_ID não configurada.");
  }

  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: nomeAba,
  });

  return (res.data.values as string[][]) ?? [];
}
