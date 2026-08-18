"use client";

import { useEffect, useState } from "react";

type Plataforma = "ios" | "android" | "outro";

export default function InstallPrompt() {
  const [plataforma, setPlataforma] = useState<Plataforma>("outro");
  const [jaInstalado, setJaInstalado] = useState(false);
  const [dispensado, setDispensado] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    setPlataforma(isIOS ? "ios" : isAndroid ? "android" : "outro");

    // Detecta se já está rodando instalado (modo standalone)
    const standaloneIOS = (window.navigator as any).standalone === true;
    const standaloneOutros = window.matchMedia("(display-mode: standalone)").matches;
    setJaInstalado(standaloneIOS || standaloneOutros);

    // Android: captura o evento que permite disparar o prompt nativo de instalação
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  if (jaInstalado || dispensado || plataforma === "outro") return null;

  async function instalarAndroid() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return (
    <div className="install-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <strong style={{ fontSize: 12.5 }}>Instale o Portal Cadence no seu celular</strong>
        <span onClick={() => setDispensado(true)} style={{ cursor: "pointer", color: "var(--muted)", fontSize: 12 }}>
          ✕
        </span>
      </div>

      {plataforma === "ios" && (
        <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6, color: "var(--muted)" }}>
          1. Toque no ícone de compartilhar <span style={{ color: "#fff" }}>⬆️</span> na barra do Safari
          <br />
          2. Toque em <span style={{ color: "#fff" }}>&quot;Adicionar à Tela de Início&quot;</span>
          <br />
          3. Confirme — o ícone aparece na sua tela, como um app
        </div>
      )}

      {plataforma === "android" && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--muted)", marginBottom: 8 }}>
            Toque no botão abaixo para instalar direto na tela inicial.
          </div>
          {deferredPrompt ? (
            <button className="login-btn" style={{ marginTop: 0 }} onClick={instalarAndroid}>
              Instalar app
            </button>
          ) : (
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
              Toque nos ⋮ (3 pontos) do Chrome → &quot;Instalar app&quot; ou &quot;Adicionar à tela inicial&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
