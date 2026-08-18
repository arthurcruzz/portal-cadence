import { google } from "googleapis";

export function getOAuthClient(redirectUri: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET não configurados.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Atrás de um proxy (Cloud Run, Vercel), req.url pode refletir o endereço
// INTERNO do container em vez do domínio público — usamos os cabeçalhos
// x-forwarded-* pra montar a URL real, a mesma que precisa bater com o
// "Authorized redirect URI" cadastrado no Google Cloud Console.
export function origemReal(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return `${proto}://${host}`;
}
