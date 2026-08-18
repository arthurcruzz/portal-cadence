import { cookies } from "next/headers";
import { parseSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { findContatoByCodigo } from "@/lib/data";

export async function getSessaoAtual() {
  const raw = cookies().get(SESSION_COOKIE_NAME)?.value;
  const dados = parseSessionCookieValue(raw);
  if (!dados) return null;

  // contatoId no cookie é o CODIGO_TITULAR_ECAD do compositor
  const contato = await findContatoByCodigo(dados.contatoId);
  if (!contato || !contato.ativo) return null;

  return { contato };
}
