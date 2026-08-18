import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, origemReal } from "@/lib/googleOAuth";
import { findContatoByEmail } from "@/lib/data";
import { createSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";

export async function GET(req: NextRequest) {
  const origem = origemReal(req);
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?erro=login-cancelado", origem));
  }

  const redirectUri = `${origem}/api/auth/google/callback`;
  const client = getOAuthClient(redirectUri);

  try {
    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      return NextResponse.redirect(new URL("/?erro=falha-login", origem));
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const emailVerificado = payload?.email_verified;

    if (!email || !emailVerificado) {
      return NextResponse.redirect(new URL("/?erro=email-nao-verificado", origem));
    }

    const contato = await findContatoByEmail(email);

    if (!contato || !contato.ativo) {
      return NextResponse.redirect(new URL("/?erro=nao-autorizado", origem));
    }

    const cookieValue = createSessionCookieValue({
      contatoId: contato.codigoTitularEcad,
      nome: contato.nome,
    });

    const response = NextResponse.redirect(new URL("/dashboard", origem));
    response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });
    return response;
  } catch (err) {
    console.error("Erro no login com Google:", err);
    return NextResponse.redirect(new URL("/?erro=falha-login", origem));
  }
}
