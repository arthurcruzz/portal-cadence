import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, origemReal } from "@/lib/googleOAuth";

export async function GET(req: NextRequest) {
  const origem = origemReal(req);
  const redirectUri = `${origem}/api/auth/google/callback`;
  const client = getOAuthClient(redirectUri);

  const url = client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });

  return NextResponse.redirect(url);
}
