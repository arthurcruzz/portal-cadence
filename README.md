# Portal Cadence — Etapa 1 e 2 (código + teste local)

Portal do compositor: login por magic link, catálogo, e a view de status
cruzando Monitoramento + Autorizações (ECAD/Digital), tudo em cima de
**dados simulados** que imitam a estrutura da sua planilha real. Nada aqui
toca no formulário de solicitação nem em nenhuma infraestrutura em produção.

## Como rodar

Requisitos: Node.js 18 ou mais recente instalado no seu computador.

```bash
cd portal-cadence
npm install
npm run dev
```

Abra `http://localhost:3000` no navegador (ou no celular, se estiver na
mesma rede Wi-Fi, usando o IP do computador em vez de `localhost`).

## Como testar o login

Não tem serviço de e-mail configurado ainda — de propósito, pra você
testar sem precisar criar conta em nada. No login:

1. Digite `elvis@exemplo.com` (ou `henrique@exemplo.com`)
2. Clique em "Receber link de acesso"
3. Vai aparecer uma caixa amarela na tela com o link direto — clique nele
4. Você cai logado no dashboard, como se tivesse clicado no link do e-mail

Em produção (Etapa 4), essa caixa amarela some e o link vai de verdade por
e-mail ou WhatsApp — a lógica de token único e expiração já está pronta,
só falta plugar o serviço de envio.

## O que já funciona (v2 — informativo, sem ações do compositor)

- **Login por magic link** — token de uso único, expira em 10 minutos,
  sessão de 30 dias em cookie assinado
- **Dashboard** — contadores clicáveis (liberações em andamento, novas
  descobertas, confirmadas), levam direto pra aba correspondente
- **Catálogo** — todas as obras do compositor (tabela OBRAS), com status
  de cadastro ECAD (Confirmado / Provisório) por obra
- **Monitorado** — todas as gravações encontradas (tabela FONOGRAMAS),
  com filtro por obra ou só novidades
- **Autorizações** — documento de liberação por obra, status ECAD/Digital,
  e assinaturas só dos coautores administrados pela Cadence (coautores de
  fora não aparecem como linha). 100% informativo — o compositor nunca
  assina dentro do portal, isso continua sendo feito por você via SafeID.

## Pendente pra próxima rodada

- Histórico de alterações (log de mudanças) na aba Autorizações — falta
  definir se esse dado já existe na planilha ou precisa ser criado

## Onde estão os dados simulados

Tudo em `src/lib/mockData.ts`. Esse arquivo imita a FORMA das suas tabelas
reais (CONTATOS, OBRAS, FONOGRAMAS, AUTORIZACOES). Editar esse arquivo é a
forma mais rápida de testar outros cenários (mais obras, outro compositor,
etc.) antes de conectar na planilha real.

## Próximos passos (fora deste código, com você no controle)

- **Etapa 3**: trocar as funções de `mockData.ts` por chamadas reais à
  Google Sheets API (Service Account) — a ASSINATURA das funções já foi
  pensada pra isso, as páginas não precisam mudar
- **Etapa 4**: configurar envio de e-mail (Resend/SendGrid) e remover o
  `devLink` da resposta da rota `/api/auth/request-link`
- **Deploy**: Cloud Run, mesmo projeto `cadence-assinaturas`, subdomínio
  novo tipo `portal.cadenceautoral.com.br` — sem tocar no que já está no ar

## Estrutura de pastas

```
src/
  app/
    page.tsx                 → tela de login
    dashboard/page.tsx        → tela inicial (contadores)
    catalogo/page.tsx         → lista de obras
    status/page.tsx           → view de status por fonograma
    api/auth/
      request-link/route.ts   → gera e "envia" o magic link
      verify/route.ts         → valida o token, cria a sessão
      logout/route.ts         → apaga a sessão
  components/
    TabBar.tsx                → navegação inferior
    StatusList.tsx            → filtros da tela de status
  lib/
    mockData.ts                → dados simulados (trocar na Etapa 3)
    session.ts                 → cookie de sessão assinado
    tokens.ts                  → tokens de login (uso único)
    auth.ts                    → leitura da sessão atual
```
