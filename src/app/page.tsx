import InstallPrompt from "@/components/InstallPrompt";

const MENSAGENS_ERRO: Record<string, string> = {
  "nao-autorizado":
    "Esse e-mail não está autorizado a acessar o portal. Se isso for um engano, fale com a Cadence.",
  "email-nao-verificado": "Não foi possível confirmar seu e-mail com o Google. Tente novamente.",
  "login-cancelado": "Login cancelado.",
  "falha-login": "Não foi possível entrar agora. Tente novamente em instantes.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const mensagemErro = searchParams.erro
    ? MENSAGENS_ERRO[searchParams.erro] ?? "Não foi possível entrar."
    : null;

  return (
    <div className="login-wrap">
      <div className="login-card">
        <img src="/cadence-logo.png" alt="Cadence" style={{ height: 48, marginBottom: 10 }} />
        <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>Portal Cadence</div>

        <a href="/api/auth/google/start" className="google-btn">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.71-1.57 2.69-3.88 2.69-6.64z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34C2.44 15.98 5.48 18 9 18z" />
            <path fill="#FBBC05" d="M3.97 10.71a5.4 5.4 0 010-3.42V4.95H.96a9 9 0 000 8.1l3.01-2.34z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
          </svg>
          Continuar com Google
        </a>

        {mensagemErro && (
          <div style={{ marginTop: 16, fontSize: 12.5, color: "#e0666b" }}>{mensagemErro}</div>
        )}
      </div>

      <InstallPrompt />
    </div>
  );
}
