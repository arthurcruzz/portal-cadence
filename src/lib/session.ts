import crypto from "crypto";

// Em produção, defina SESSION_SECRET no ambiente do Cloud Run (Secret Manager).
const SECRET = process.env.SESSION_SECRET || "dev-secret-troque-em-producao";

export const SESSION_COOKIE_NAME = "cadence_session";

export type SessionData = {
  contatoId: string;
  nome: string;
};

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

// Cookie assinado: base64(dados) + "." + assinatura HMAC.
// Não precisa de tabela de sessões — se a assinatura bater, o cookie é válido.
export function createSessionCookieValue(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseSessionCookieValue(value: string | undefined | null): SessionData | null {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as SessionData;
  } catch {
    return null;
  }
}
