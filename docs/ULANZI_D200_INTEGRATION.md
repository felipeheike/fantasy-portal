# 🎛️ Integração Ulanzi D200 (Ulanzi Studio) ↔ Fantasy Portal

Avaliação e plano, escrito em 2026-11-25. **Nada foi implementado ainda.** O plano se baseia no código atual: `app/src/app/page.tsx`, `store/gameStore.ts`, `components/game/*` e as rotas em `app/src/app/api/*`.

---

## 1. Avaliação da ideia

**Vale a pena?** Sim, e combina com o produto. O Fantasy Portal já é um jogo com escolhas discretas (`options`, `tacticalOptions`, dado, enigma, visão), e um deck físico com teclas LCD é praticamente um "controle de mesa de RPG". Também já existe uma veia "físico/multimodal" no app (Olho do Mestre com câmera, Spotify, TTS). A D200 se encaixa nessa linha.

**O ponto que define a arquitetura:** o loop narrativo **não roda no servidor**. Quem chama `/api/chat` é o navegador (`useObject().submit(...)` em `page.tsx:156/314`), e o estado do jogo (status, inventário, cena atual, escolha pendente) vive no Zustand persistido em `localStorage`. Por isso:

- ❌ **"A D200 chama a API e joga sozinha"** não funciona sem reescrever o loop no servidor. Uma chamada direta a `/api/chat` geraria uma cena que nenhuma aba aplica no store, e o estado ia divergir.
- ✅ **"A D200 é um controle remoto da aba aberta"** funciona. A tecla manda um comando, o comando chega na aba do jogo e a aba executa exatamente o que um clique faria. Toda a lógica atual (dado, DC, toasts, persistência via `useJourneyPersistence`) continua valendo sem duplicar nada.

**E o n8n?** Ele é útil, mas **não deve ficar no caminho crítico tecla → ação**. Ele adiciona um salto de rede e um ponto de falha, e com o `WEBHOOK_URL` público (`n8n.duplecake.space`) ainda passa pelo túnel. Onde ele brilha é na **direção inversa e nas automações**: o jogo emite eventos ("combate começou", "HP crítico", "game over") e o n8n orquestra o resto (luzes no Home Assistant, notificações etc.). Detalhes na seção 5.

**Riscos e limitações**
| Risco | Mitigação |
|---|---|
| Ulanzi Studio roda em Windows/macOS, não no servidor Linux. O plugin roda no PC onde a D200 está plugada. | O plugin fala com o servidor pela LAN ou pelo Tailscale (`*.ts.net`). Não precisa expor nada publicamente. |
| SDK da Ulanzi ainda novo e pouco documentado (protocolo JS v2.x, WebSocket com o Studio) | Fase 1 não depende do SDK (só atalhos de teclado). O plugin custom fica para a Fase 3. |
| Token de dispositivo vazar = alguém controlando sua jornada | Token próprio por dispositivo, com hash no banco, escopo só de "controle", revogável. Mesmo padrão de `lib/shareToken.ts`. |
| Aba fechada ou em segundo plano | O endpoint responde `409 no_active_session`, e a tecla mostra ícone de "offline". |
| Duas abas abertas | A última aba que se registrou vira a "controlada" (lease), como o player do Spotify Connect. |

> ⚠️ **A verificar no aparelho:** a lista exata de ações nativas do Ulanzi Studio (se existe ação "HTTP request"/"Open URL" sem plugin), a contagem e o layout das teclas da D200, e se o Studio tem build para Linux. A busca não confirmou uma ação HTTP nativa. O caminho oficial para isso é o [UlanziDeckPlugin SDK](https://github.com/UlanziTechnology/UlanziDeckPlugin-SDK) (plugins HTML/WebView ou Node.js, manifest + `app.js`, comunicação por WebSocket com o Studio).

---

## 2. Arquitetura proposta (em camadas, cada uma útil sozinha)

```
┌────────────┐  hotkey (Fase 1)   ┌──────────────────────────┐
│ Ulanzi D200│ ─────────────────▶ │ Aba do jogo (navegador)  │
│  + Studio  │                    │  useRemoteControl()      │
│  (PC)      │  HTTP + token      │   ▲ SSE                  │
│  plugin    │ ─────────┐         └───┼──────────────────────┘
└─────▲──────┘          ▼             │
      │ estado   ┌──────────────────────────────┐   eventos   ┌─────┐   ┌───────────────┐
      └──────────│ /api/remote/* (Next.js)      │ ──────────▶ │ n8n │──▶│ Home Assistant│
       (polling/ │  command · state · stream    │  webhook    └─────┘   │ Spotify, etc. │
        SSE)     │  bus em memória por player   │                       └───────────────┘
                 └──────────────────────────────┘
```

---

## 3. Fases

### Fase 1: atalhos de teclado (sem backend, 1 tarde)
Hoje o app não tem atalhos globais (só `Enter` em inputs). Basta criar um hook `useGameHotkeys()` montado em `page.tsx`, e no Ulanzi Studio usar a ação nativa de **Hotkey** em cada tecla.

| Tecla D200 | Atalho | Ação no app | Onde já existe a lógica |
|---|---|---|---|
| Opção 1–4 | `Alt+1..4` | Escolhe a opção N de `currentScene.options` | `OptionPicker.tsx` / `ChoiceSelector.tsx` |
| Rolar dado | `Alt+R` | Dispara o `DiceRoller` | `ActionOrchestrator.handleDiceRoll` |
| Narração ▶/⏸ | `Alt+Space` | Play/pause do `<audio id="audio-{sceneId}">` da última cena | `NarrativePanel.tsx:450-475` |
| Modo leitura | `Alt+L` | `toggleReadingMode()` | `gameStore` |
| Inventário / Grimório / Influência | `Alt+I/G/F` | Abre o painel | `InventoryPanel`, `SkillsPanel`, `InfluencePanel` |
| Pergunta ao Mestre | `Alt+Q` | Foca o `InquiryPanel` (gasta insight) | `InquiryPanel.tsx` |
| Câmera (visão) | `Alt+V` | Abre o fluxo do Olho do Mestre quando `recommendedInputType === 'vision_requirement'` | `ActionOrchestrator.handleVisionAction` |
| Spotify próxima/pausa | `Alt+N/P` | Chama `/api/audio/spotify/control` | `SpotifyPlayerWidget.tsx` |

Regras: ignorar o atalho quando o foco está num `input`/`textarea`, respeitar `isLoading` (não submeter durante o streaming) e mostrar um toast curto (Sonner) confirmando a ação, seguindo a convenção do app.

**Prós:** zero infraestrutura, zero segurança nova, valida a ergonomia antes de investir. **Contras:** só funciona com a janela do navegador em foco, e os ícones das teclas são estáticos (a tecla "Opção 1" não sabe o texto da opção).

### Fase 2: API de controle remoto + push para a aba (2–3 dias)
Tira a dependência de foco e prepara o terreno para teclas dinâmicas.

**Modelo novo (Prisma):**
```prisma
model DeviceToken {
  id         String    @id @default(cuid())
  playerId   String
  player     Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  name       String    // "Ulanzi D200 - Desktop"
  tokenHash  String    @unique   // sha256 via lib/shareToken.hashToken
  scopes     String[]  @default(["remote:control", "remote:read"])
  lastUsedAt DateTime?
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())
}
```
- Gerado e revogado no **Perfil** (nova seção "Dispositivos"). O token aparece **uma única vez** (`generateToken()`).
- Registrar emissão e revogação em `AuditLog` (`lib/audit.ts`).

**Rotas** (fora do `matcher` do middleware, então **cada uma valida a própria auth**, conforme o CLAUDE.md):

| Rota | Auth | Função |
|---|---|---|
| `POST /api/remote/command` | `Authorization: Bearer <deviceToken>` | Body `{ "action": "choose", "index": 1 }`, `{ "action": "roll" }`, `{ "action": "audio.toggle" }` etc. Valida com Zod (`z.discriminatedUnion`), publica no bus do player e responde `202`, ou `409` se não houver aba ativa. Rate limit simples (ex.: 5 req/s por token). |
| `GET /api/remote/stream` | sessão NextAuth (`getSessionUser()`) | **SSE** que a aba do jogo assina. Recebe os comandos e os executa. |
| `GET /api/remote/state` | device token | Snapshot leve para o deck: `{ online, isLoading, hp, maxHp, sp, inputType, options:[{index,label}], canRoll, hasAudio }` |
| `POST /api/remote/state` | sessão | A aba publica esse snapshot a cada `completeScene`/`updateStatus` (o servidor guarda em memória). Evita reconstruir o estado a partir do `Journey.history` no banco. |

**Bus:** um `EventEmitter` em memória, indexado por `playerId`. Basta porque roda um único container Next. Se um dia houver mais réplicas, trocar por Postgres `LISTEN/NOTIFY` (o Postgres já está na stack) sem mudar o contrato.

**Cliente:** o hook `useRemoteControl()` abre o `EventSource('/api/remote/stream')` e mapeia cada `action` para **as mesmas funções da Fase 1**. A Fase 1 e a Fase 2 compartilham um `dispatchGameCommand(cmd)`, de modo que a lógica de "o que a tecla faz" fica num lugar só.

**Ulanzi Studio nessa fase:** se o Studio tiver ação nativa de HTTP/URL, ela já basta. Se não tiver, segue para a Fase 3, ou usa um script local (`curl`) via ação "Executar programa" como ponte provisória.

### Fase 3: plugin Ulanzi próprio com teclas dinâmicas (3–5 dias)
Esse é o "uau": a tecla mostra o **texto da opção**, o **HP como barra** e o dado acende quando há teste pendente.

- Plugin **Node.js** (SDK oficial), em `fantasy-portal/tools/ulanzi-plugin/`, com manifest declarando as ações: `option` (configurável 1–4), `roll`, `audio`, `status-hp`, `status-sp`, `inquiry`, `vision`.
- O Property Inspector (HTML) pede **URL do servidor** (ex.: `https://<host>.ts.net:25035`) e **device token**, guardados nas settings do plugin.
- Loop: assina `GET /api/remote/state` (polling de 1–2 s, ou SSE se o runtime do plugin aguentar conexão longa) e, a cada mudança, chama `setTitle`/`setImage` em cada tecla:
  - **Opção N:** texto da opção quebrado em 2–3 linhas. Fica apagada se a opção não existir.
  - **Dado:** pulsa quando `inputType` pede rolagem.
  - **HP/SP:** imagem gerada (canvas/SVG) com barra e cor (verde → vermelho, piscando abaixo de 25%).
  - **Durante o streaming** (`isLoading`): todas as teclas de ação ficam com ícone de "pensando" e ignoram cliques.
  - **Offline/sem aba:** ícone cinza.
- Tecla pressionada → `POST /api/remote/command`.

### Fase 4: eventos para o n8n (opcional, 1–2 dias)
Aqui o n8n entra de verdade.

- Novo emissor `lib/events.ts` → `POST` para um webhook do n8n configurado por env (`N8N_EVENTS_WEBHOOK_URL`, por rede interna: `http://n8n:5678/webhook/...`, já que os dois containers estão na `duplecake-net`), assinado com HMAC (`N8N_EVENTS_SECRET`) e disparado em *fire-and-forget* (nunca bloquear o jogo).
- Eventos sugeridos (todos derivados do que o schema já produz): `scene.completed`, `combat.started` (quando há `tacticalOptions`), `hp.critical`, `item.gained`, `moral.milestone`, `journey.ended` (`forcedEndingType`/game over).
- Workflows de exemplo no n8n:
  - 💡 **Home Assistant:** luz vermelha pulsando em combate, âmbar em cena de mistério, apaga no game over.
  - 📱 Notificação (Telegram/ntfy) "Sua jornada terminou, PDF disponível".
  - 🔁 Opcional: o n8n também pode chamar `POST /api/remote/command` com um device token próprio. Exemplo: um botão Zigbee pela casa rolando o dado. É o mesmo contrato, sem código extra.

---

## 4. Layout sugerido da D200

Exemplo para um grid de 5×3 (ajustar ao layout real do aparelho):

```
┌────────┬────────┬────────┬────────┬────────┐
│ OPÇÃO 1│ OPÇÃO 2│ OPÇÃO 3│ OPÇÃO 4│  🎲    │
├────────┼────────┼────────┼────────┼────────┤
│ ❤️ HP   │ ✨ SP   │ 🎒 Inv  │ 📜 Grim │ ❓ Mestre│
├────────┼────────┼────────┼────────┼────────┤
│ 🔊 Narr │ 📖 Leit │ 👁️ Visão│ ⏭ Spot  │ ⚙️ Pasta│
└────────┴────────┴────────┴────────┴────────┘
```
Usar uma **pasta/página** separada para as ações de admin (forçar próximo tipo de cena via `setForcedNextAction`, forçar final), que é ótima para demos. Essas ações só devem ser aceitas se o device token pertencer a um `role === 'ADMIN'` e tiver o escopo `remote:admin`.

---

## 5. Por que não pôr o n8n no meio do comando?

| | Plugin → API direta | Plugin → n8n → API |
|---|---|---|
| Latência por tecla | ~1 salto (LAN/Tailscale) | +1 salto, + execução do workflow |
| Pontos de falha | Next | Next + n8n (+ túnel, se usar URL pública) |
| Onde fica a lógica | No app, versionada e testável (Vitest) | Espalhada em workflows JSON |
| Quando o n8n faz sentido | Reagir a eventos do jogo, integrar outros sistemas (Home Assistant, notificações), gatilhos que não são a D200 | |

Recomendação: **comando direto, eventos via n8n.**

---

## 6. Checklist de implementação

- [ ] **F1** `src/lib/remote/commands.ts`: tipo `GameCommand` + `dispatchGameCommand()` (com testes Vitest para o mapeamento)
- [ ] **F1** `src/hooks/useGameHotkeys.ts` montado em `page.tsx`; configurar as Hotkeys no Ulanzi Studio
- [ ] **F2** Modelo `DeviceToken` + migration (`make prisma-migrate`) + seção "Dispositivos" no Perfil
- [ ] **F2** `api/remote/{command,state,stream}`, com auth explícita em cada rota e rate limit
- [ ] **F2** `src/hooks/useRemoteControl.ts` (EventSource + publicação do snapshot de estado)
- [ ] **F3** `tools/ulanzi-plugin/` (Node.js, SDK oficial) com teclas dinâmicas
- [ ] **F4** `lib/events.ts` + workflow n8n de exemplo (Home Assistant)
- [ ] Docs: adicionar o item em `docs/FEATURES.md` e os comandos em `docs/COMMANDS.md` quando cada fase sair

## 7. Ordem recomendada
1. **Fase 1 primeiro:** valida se jogar pelo deck é gostoso, com custo quase zero.
2. **Fase 2 + 3 juntas:** é onde está o valor real (teclas que mostram as opções). A 2 sozinha só tira a necessidade de foco.
3. **Fase 4** quando quiser imersão de ambiente (luzes etc.).
