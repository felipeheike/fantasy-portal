# 🗺️ Plano de Ação e Melhorias

Levantamento feito em 2026-09-16 a partir do estado real do código (não de suposições). Cada item foi verificado no repositório antes de entrar na lista. Organizado por prioridade — Fases 2 e 4 concluídas, Fase 3 parcial, Fase 1 congelada por decisão do usuário (ver nota na seção).

## 🧊 Fase 1 — Segurança Crítica (congelada em 2026-09-16, decisão consciente do usuário)

**Status:** o usuário optou por congelar os 3 itens abaixo por enquanto — o app roda em ambiente local com acesso restrito a ele mesmo, então a criticidade percebida é baixa. Fica no radar para retomar quando fizer sentido (ex.: antes de expor a aplicação a mais gente).
**Ressalva registrada:** o repositório `felipeheike/fantasy-portal` é **público** no GitHub. Isso não muda o risco dos itens 2 e 3 (dependem de uso/exposição do app), mas o item 1 (chave exposta no histórico do git) não depende de quem acessa o app — qualquer pessoa que encontre o repositório pode pegar a chave. O usuário foi avisado dessa distinção e escolheu congelar mesmo assim.

### 1. Chave de API do Google exposta no histórico do Git
`app/.env.example:45` tem um comentário com uma chave real (`AIzaSy...`), commitada em `73df0cc` (2026-05-31) e presente no repositório público `github.com/felipeheike/fantasy-portal`.
*   **Ação imediata:** revogar/regenerar essa chave no [Google AI Studio](https://aistudio.google.com/app/apikey).
*   **Ação no código:** remover a linha do `.env.example` (o exemplo de `curl` não precisa de uma chave real).
*   **Opcional:** se o repositório for sensível, reescrever o histórico (`git filter-repo`) para apagar o segredo — revogar a chave já neutraliza o risco principal.

### 2. Chave de criptografia com fallback hardcoded
`app/src/lib/security.ts:6` usa `process.env.MASTER_ENCRYPTION_KEY || 'f4nt4sy-p0rt4l-m4st3r-k3y-32-ch4rs'`. Essa variável **não existe** em `.env.example`, então qualquer ambiente que seguiu o `SETUP.md` está rodando com a chave fallback — que agora está public no código-fonte. Isso protege as chaves BYOK dos jogadores e os segredos de MFA armazenados no Postgres.
*   **Ação:** gerar uma chave aleatória forte (`openssl rand -hex 32`), definir `MASTER_ENCRYPTION_KEY` em produção, documentar em `.env.example`, e fazer o código falhar no boot se a variável não estiver setada (em vez de usar fallback).
*   **Consequência:** qualquer segredo já gravado com a chave antiga precisa ser re-criptografado após a troca (script de migração pontual).

### 3. Rotas de IA sem rate limiting
`/api/chat`, `/api/image`, `/api/vision` e `/api/audio` chamam provedores pagos (OpenAI, Google, Anthropic) sem nenhum limite de taxa por usuário. Um usuário autenticado (ou uma sessão comprometida) pode gerar custo ilimitado.
*   **Ação:** limite simples por usuário/IP (ex.: Redis, que já está no stack, com um contador de janela deslizante) nessas rotas.

## ⚠️ Fase 2 — Robustez e Confiabilidade ✅ (feito em 2026-09-16)

### 4. Zero testes automatizados — ✅ base criada
Adicionado Vitest (`app/vitest.config.ts`, script `npm test` / `make test`) com testes iniciais para `lib/security.ts` (round-trip encrypt/decrypt, `maskKey`) e `lib/ai/providers.ts` (`getAIConfigMetadata`, resolução de provider por prefixo/BYOK). 12 testes passando.
*   **Ainda em aberto:** cobertura é propositalmente mínima — ainda falta validar o `sceneSchema` contra exemplos reais de resposta da IA, e testes de integração para rotas de API.

### 5. Auth checks duplicados e não centralizados — ✅ corrigido + bug real encontrado
Ao investigar a inconsistência do matcher, foi encontrada uma rota **sem nenhuma checagem de auth**: `POST /api/journey/[id]/export` gerava e expunha o PDF de qualquer jornada (de qualquer jogador) para quem soubesse o `id`. Corrigido para exigir sessão e checar `journey.playerId === session.user.id` (ou `role === 'ADMIN'`), igual ao padrão usado em `journey/[id]/route.ts`. O `CLAUDE.md` do projeto também foi corrigido — não afirma mais que a proteção é "centralizada no middleware", já que na prática cada rota faz sua própria checagem.

### 6. Dependência morta do SDK antigo do Gemini — ✅ removida
`@google/generative-ai` só era usada por dois scripts de debug obsoletos (`tools/debug/identify-models.mjs`, `list-models-v2.mjs`), que testavam modelos Gemini 1.5 de antes da migração para Claude como padrão — e que também tinham a mesma chave do item 1 hardcoded. Scripts removidos, dependência desinstalada, `package-lock.json` regenerado.

### 7. `any` espalhado por causa de sessão não tipada — ✅ corrigido
Criado `src/types/next-auth.d.ts` (module augmentation de `Session`/`JWT`) e `src/types/auth.ts` (`PlayerRole`/`PlayerAccountStatus`), mais `getSessionUser()`/`isAdmin()` em `lib/auth.ts`. Os 39 usos de `(session.user as any)` em 20 arquivos viraram `session.user` tipado. `tsc --noEmit` limpo.

### 8. `tsconfig.tsbuildinfo` versionado — ✅ corrigido
Removido do git (`git rm --cached`) e adicionado `*.tsbuildinfo` ao `app/.gitignore`.

## 🧹 Fase 3 — Manutenibilidade ✅ parcial (feito em 2026-09-16)

### 9. Arquivos grandes demais para editar com segurança — ✅ `page.tsx` feito, resto pendente
`page.tsx` foi reduzido de 803 para 591 linhas (-26%), extraindo (sem mudar nenhuma lógica, só realocando):
*   `sceneSchema` → `src/lib/ai/sceneSchema.ts` (definição Zod pura, zero risco).
*   `useProfileBootstrap` (fetch de AI status + perfil/temas + Spotify conectado).
*   `useSpotifyMoodSync` (dispara playback do Spotify por mood da cena).
*   `useJourneyPersistence` (criação da Journey no banco + sync incremental de cenas + PATCH periódico).

O núcleo de streaming da IA (`useObject`, `onFinish`, `triggerAI`) foi **deixado como está** — é o código mais crítico e mais interdependente do arquivo, e mover às cegas sem conseguir testar de ponta a ponta seria o tipo de risco que a Fase 1 já não corre. Testado ao vivo no navegador antes e depois da mudança (login, carregar jornada existente, submeter uma ação e ver uma cena nova gerada pela IA de verdade, abrir inventário) — comportamento idêntico.

`theme-hub/page.tsx` (802), `traveler-chamber/page.tsx` (795), `gameStore.ts` (791) e `NarrativePanel.tsx` (762) continuam intocados — ficam para uma próxima rodada.

**Achados no caminho (não corrigidos aqui, viraram itens 16 e 17):**
*   `app/.env` real tinha `TEXT_MODEL="gemini-2.5-flashtrrrrrrrrrr"` (erro de digitação) — corrigido para `gemini-2.5-flash` a pedido do usuário, o que provavelmente estava quebrando toda geração de cena em produção antes desta sessão. Já corrigido, não precisa de item próprio.

### 16. `sceneSchema` do cliente desatualizado em relação ao do servidor
`api/chat/route.ts` tem sua própria cópia de `sceneSchema`, mais completa (com `.describe()` que vira parte do prompt pro modelo, mais os campos `skillChanges`, `durability`, `maxDurability`, `audioVoice`, `worldUpdate.reputations`) do que a cópia client-side que acabou de ser extraída para `src/lib/ai/sceneSchema.ts` nesta sessão. Como o Zod por padrão descarta chaves não declaradas ao fazer parse, é possível que a IA gere esses campos e o cliente simplesmente os descarte silenciosamente — o que explicaria bugs esporádicos em level-up de habilidade, durabilidade de equipamento ou seleção de voz de áudio.
*   **Ação:** auditar as duas cópias campo a campo e todos os lugares que leem `scene.skillChanges`/`scene.durability`/`scene.audioVoice` no client antes de unificar — não é uma troca mecânica, os dois schemas podem ter divergido de propósito em algum campo.

### 17. `POST /api/journey/[id]/scenes` quebra em cenas sem `visualDescription`
Reproduzido ao vivo: a rota lança 500 (`Argument visualDescription is missing`) para qualquer cena sem esse campo, porque `visualDescription String` é obrigatório no schema do Prisma mas o código não tem fallback para ele (diferente de `options`, `tacticalOptions`, `puzzle`, que já usam `|| []`/`|| {}`). Isso afeta jornadas seed/legadas cuja cena inicial nunca teve uma `visualDescription` real. O idempotency check (`existingScene`) não protege esse caso quando a jornada nunca teve linha na tabela `Scene` normalizada (só no `history` JSON legado) — todo reload tenta recriar a cena do zero e cai no campo obrigatório ausente.
*   **Ação:** adicionar fallback (`visualDescription: scene.visualDescription || ''`) e decidir se cenas legadas sem esse campo devem ganhar uma migração de backfill.

### 10. Logging sem estrutura — ✅ feito
Criado `src/lib/logger.ts` (log/warn silenciados em produção, error sempre visível). As 73 chamadas `console.log/error/warn` em 28 arquivos viraram `logger.*`. `vitest.config.ts` precisou de um alias `@` → `./src` porque o Vitest não resolve o path mapping do `tsconfig.json` sozinho — sem isso os testes de `security.ts` quebravam ao importar o novo logger (pego durante a verificação, não em produção).

## 🛠️ Fase 4 — Infraestrutura e DX ✅ (feito em 2026-09-16)

### 11. Sem CI — ✅ criado
Adicionado `.github/workflows/ci.yml`: roda em push/PR que tocam `app/**`, faz `npm ci`, `prisma generate`, typecheck, `npm test` e `npm run build`. Validado localmente simulando o pipeline do zero (container limpo, sem cache) antes de subir — os quatro passos passam sem erro.
*   **Lint ficou fora do bloqueio:** rodar `npm run lint` de verdade revelou **185 erros pré-existentes** no código (não relacionados a nada tocado aqui — `gameStore.ts`, `SpotifyPlayerWidget.tsx`, `ThemeProvider.tsx`, `lib/ai/discovery.ts`, etc., a maioria `@typescript-eslint/no-explicit-any` e regras novas de `react-hooks` do `eslint-config-next`). Bloquear nisso deixaria o CI vermelho desde o primeiro commit. O lint roda no workflow com `continue-on-error: true` (visível, não bloqueia) — ver item 14.

### 12. Stacks dev e prd podem ficar rodando em paralelo sem aviso — ✅ documentado
Ao rodar `make prd`, o Docker acusou containers órfãos da stack dev (`fantasy_portal_node_dev`, `db_dev`, `minio_dev`, `redis_dev`) ainda ativos — fácil de esquecer rodando e consumir recursos/portas. Anotado no `CLAUDE.md` e no `docs/COMMANDS.md` que só uma stack deve rodar por vez.
*   **Ainda em aberto:** um `make prd-clean`/`make dev-clean` que derruba a outra stack automaticamente seria mais à prova de esquecimento do que só a nota na documentação.

### 13. `next.config.ts` sem headers de segurança — ✅ básico adicionado
Adicionado `headers()` em `next.config.ts` com `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` e `Referrer-Policy: strict-origin-when-cross-origin`, aplicados a todas as rotas. Build validado com a mudança.
*   **Deliberadamente fora do escopo:** uma Content-Security-Policy real. O app carrega o SDK do Spotify (`sdk.scdn.co`) via script externo e imagens/áudio do MinIO — uma CSP mal ajustada quebraria isso silenciosamente, e isso só dá pra validar clicando na aplicação de ponta a ponta no navegador (não foi feito aqui). Ver item 15.

### 14. Débito de lint: 185 erros pré-existentes
Descoberto ao configurar o CI (item 11). Maior parte é `@typescript-eslint/no-explicit-any` (principalmente em `gameStore.ts`, `lib/audio.ts`, `lib/ai/discovery.ts`, `lib/storage.ts`, `lib/prisma.ts`) e regras novas de `react-hooks/set-state-in-effect` / `react-hooks/immutability` do `eslint-config-next` mais recente (`SpotifyPlayerWidget.tsx`, `ThemeProvider.tsx`). Não é regressão de nada feito nas Fases 2 ou 4 — é debt acumulado que o projeto nunca teve lint rodando em CI para pegar.
*   **Ação:** rodar `npm run lint -- --fix` para os 6 erros auto-corrigíveis, depois passar arquivo por arquivo pelos `no-explicit-any` (tipar de verdade, não silenciar com `eslint-disable`) e revisar os `useEffect` com `setState` síncrono caso a caso (podem ser bugs reais de cascading renders, não só estilo).
*   **Depois disso:** remover o `continue-on-error: true` do step de lint no CI.

### 15. Content-Security-Policy real
Ver nota do item 13. Precisa de uma sessão de teste manual no navegador (chat, imagens, TTS, widget do Spotify, exportação de PDF) para levantar a lista real de origins externos antes de escrever a policy — não é seguro adivinhar isso às cegas.

---

## Resumo de prioridade

| # | Item | Esforço | Risco se ignorado | Status |
|---|------|---------|---------------------|--------|
| 1 | Chave Google exposta | Baixo | Uso indevido da chave, custo na conta | 🧊 Congelado (decisão consciente — repo é público, ver nota acima) |
| 2 | Chave de criptografia hardcoded | Baixo–Médio | Todas as BYOK/MFA descriptografáveis | 🧊 Congelado (app local, uso restrito) |
| 3 | Rate limiting em rotas de IA | Médio | Custo ilimitado por abuso | 🧊 Congelado (app local, uso restrito) |
| 4 | Ausência de testes | Alto (contínuo) | Regressão silenciosa | ✅ Base criada (12 testes) |
| 5 | Auth não centralizado | Médio | Rota nova sem proteção | ✅ Corrigido + IDOR real achado e corrigido |
| 6 | SDK morto do Gemini | Trivial | Nenhum (só limpeza) | ✅ Removido |
| 7 | `any` na sessão | Médio | Bugs de tipagem em auth | ✅ Corrigido |
| 8 | `tsbuildinfo` versionado | Trivial | Ruído em diffs/commits | ✅ Corrigido |
| 9 | Arquivos grandes | Alto (contínuo) | Custo de manutenção crescente | 🟡 `page.tsx` feito (-26%), resto pendente |
| 10 | Logging sem estrutura | Baixo | Debug de produção mais lento | ✅ Corrigido |
| 11 | Sem CI | Médio | Bugs chegam a produção sem checagem | ✅ Criado (lint não-bloqueante) |
| 12 | Dev/prd em paralelo | Trivial | Confusão, consumo de recursos | ✅ Documentado |
| 13 | Sem headers de segurança | Baixo | Superfície de ataque maior no client | ✅ Headers básicos adicionados |
| 14 | Débito de lint (185 erros) | Alto (contínuo) | CI de lint fica sempre não-confiável | ⬜ Não iniciado |
| 15 | CSP real | Médio | Precisa de teste manual no navegador antes | ⬜ Não iniciado |
| 16 | `sceneSchema` cliente/servidor divergentes | Médio | Campos da IA descartados silenciosamente | ⬜ Não iniciado |
| 17 | 500 em cena sem `visualDescription` | Baixo | Falha ao sincronizar jornadas legadas/seed | ⬜ Não iniciado |
