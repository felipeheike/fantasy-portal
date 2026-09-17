# 🌌 Roadmap de Funcionalidades — Sugestões

Levantamento de **novas** funcionalidades (não itens de dívida técnica — para isso ver `ACTION_PLAN.md`), feito em 2026-09-16 a partir do estado real do produto: contrato de cena (`sceneSchema`), mecânicas em `rules/mechanics/CORE_MECHANICS.md`, modelos do Prisma (`Player`/`Journey`/`Scene`/`Asset`) e o que já existe hoje (`docs/FEATURES.md`). Cada ideia indica em cima de qual peça existente ela se apoiaria, para não propor nada que já exista ou que exija reescrever a base.

Organizado em duas frentes — **Jogador** e **Administrador** — e dentro de cada uma por tema. Cada item tem uma estimativa aproximada de esforço/impacto para ajudar a priorizar; nenhuma foi iniciada.

---

## 🎮 Jogador (usuário comum)

### Narrativa e progressão

**1. Codex/Bestiário automático**
Gerar uma "enciclopédia" da jornada a partir dos dados que a IA já produz — `worldUpdate.reputations` e NPCs/facções citados na narração viram entradas de um codex navegável (nome, resumo, relação atual com o jogador). Não precisa de novo campo no schema da IA; é uma tela nova que agrega o que já é persistido em `Scene.worldUpdate` ao longo da jornada.
*Esforço: médio · Apoia-se em: `worldUpdate.reputations`, `InfluencePanel.tsx` (heurística de bucket já existe e pode ser reaproveitada).*

**2. Resumo automático de capítulo ("Anteriormente, em...")**
Para jornadas longas, gerar (via IA, reaproveitando o mesmo `getTextModel`) um resumo curto do que aconteceu antes de retomar uma sessão — útil porque o histórico vira JSON grande e o jogador pode esquecer o contexto entre sessões.
*Esforço: baixo–médio · Apoia-se em: `Journey.history`, `lib/ai/providers.ts`.*

**3. Forja de habilidades narrativa**
Hoje o Grimório usa habilidades que a IA concede via `skillChanges`. Uma extensão natural é permitir que o jogador *proponha* uma ação criativa não listada nas opções (ex.: combinar dois itens do inventário) e a IA decida narrativamente se isso vira uma habilidade nova — já existe o padrão de input livre em `InquiryPanel.tsx`, isso generalizaria esse padrão para fora dos enigmas.
*Esforço: médio · Apoia-se em: `InquiryPanel.tsx`, `skillChanges`, `rules/mechanics/CORE_MECHANICS.md`.*

**4. Árvore de decisões / timeline visual**
Uma linha do tempo visual da jornada (cada `Scene.order` como um nó, com a opção escolhida), permitindo "relembrar" pontos de virada sem reler o PDF inteiro. Puramente leitura sobre dados que já existem em `Scene`.
*Esforço: médio · Apoia-se em: `Scene.order`, `selectedOption`, já persistidos por jornada.*

### Multimodal e imersão

**5. Entrada por voz (speech-to-text)**
Complemento natural ao TTS existente: o jogador dita a ação em vez de digitar/escolher, especialmente relevante no fluxo do "Olho do Mestre" (câmera) onde o app já assume um contexto mais físico/mobile.
*Esforço: médio · Apoia-se em: `ActionOrchestrator.tsx`, Web Speech API ou Whisper via provider já configurado.*

**6. Cartão de personagem compartilhável**
Uma imagem única (não o PDF completo) com status atual, avatar gerado e karma — pensada para compartilhar em redes sem exportar a jornada inteira. Reaproveita a geração de imagem (`OpenAI DALL-E`/`Imagen`) e o pipeline de canvas que já existe para o PDF (`lib/pdfUtils.ts`/`html2canvas`).
*Esforço: baixo–médio · Apoia-se em: `lib/exportUtils.ts`, `Asset`.*

**7. Trilha sonora gerativa como alternativa ao Spotify**
Para jogadores sem conta Spotify, usar o mesmo provider de áudio (Gemini Audio/OpenAI) para gerar ambientação instrumental por cena/mood, como fallback de `SpotifyPlayerWidget.tsx` em vez de silêncio.
*Esforço: médio–alto (custo de geração por cena) · Apoia-se em: `lib/ai/providers.ts` (getAudioModel), mood já presente no `sceneSchema`.*

### Social / multiplayer leve

**8. Modo espectador (somente leitura) — ✅ implementado (2026-09-16)**
Link de compartilhamento com token de uso único (`JourneyShareLink`, `POST/GET /api/journey/[id]/share`, `POST .../revoke`). Quem abre primeiro resgata o acesso (`POST /api/spectate/redeem`) e passa a ler a jornada via `GET /api/spectate/session` (tela dedicada em `/spectate/[token]`, `SpectatorView.tsx`, sem tocar na store global do jogo). O acesso não expira sozinho — fica valendo até o dono revogar pela seção "Compartilhamento" em `JourneyDetailsModal.tsx`.
*Apoia-se em: mesmo padrão de auth+ownership de `journey/[id]/export`, `lib/shareToken.ts` (token opaco + hash sha256, sem depender de JWT).*

**9. Jornadas cooperativas (2 jogadores, 1 história)**
Extensão mais ambiciosa: dois `Player` compartilhando uma `Journey`, cada um controlando um personagem, turnos alternados. Exigiria repensar `Journey.playerId` para N:N — é o item de maior esforço da lista e só faz sentido se houver demanda real por multiplayer.
*Esforço: alto · Requer: mudança de schema (`Journey` para many-to-many com `Player`), sincronização de turno.*

### Acessibilidade e personalização

**10. Presets de acessibilidade no Theme Hub — ✅ implementado (2026-09-16)**
Três temas embutidos (`src/lib/themePresets.ts`, `ACCESSIBILITY_PRESETS`), ativáveis com um clique direto na lista principal do Theme Hub, ao lado do "Tema Padrão" — sem precisar passar pelo formulário de criação: **Alto Contraste** (paletas dark/light com 8 tokens precisos, WCAG AA/AAA), **Leitura Fácil** (fonte Atkinson Hyperlegible, feita pelo Braille Institute) e **Contraste Seguro** (paleta Okabe-Ito, azul em vez de âmbar/vermelho para daltonismo). Continuam também disponíveis na aba "Essências" do formulário de criação, como ponto de partida pra quem quiser personalizar sua própria variante. Também adicionado um toggle global "Reduzir Animações" (`gameStore.reduceMotion`) via `MotionConfig` do framer-motion, que respeita `prefers-reduced-motion` do SO por padrão.
*Apoia-se em: mesmo padrão dos presets de "Essência" cosméticos já existentes; tamanho de texto ajustável ficou fora do escopo (exigiria um mecanismo novo de escala de fonte, não cabe no modelo de tema atual).*

**11. Narração em outros idiomas**
Hoje a narrativa é fixa em PT-BR por convenção do prompt. Tornar o idioma da narração uma preferência de jogador (mantendo os nomes de campos do schema em inglês, só o conteúdo textual muda) abriria o app para outros públicos.
*Esforço: médio · Apoia-se em: prompt em `api/chat/route.ts`, `Player.aiPreferences`.*

---

## 🛡️ Administrador

### Observabilidade e custo

**12. Dashboard de custo/uso por provedor**
`Player.usageStats` já existe no schema mas não há uma tela que agregue isso por provedor (Google/OpenAI/Anthropic) e por período. Direto relacionado ao item 3 do `ACTION_PLAN.md` (rate limiting congelado) — mesmo sem limitar, só *visualizar* gasto estimado já dá ao admin visibilidade que hoje não existe.
*Esforço: médio · Apoia-se em: `Player.usageStats`, `admin/dashboard/page.tsx`.*

**13. Monitor de sessões ao vivo**
Ver quais jogadores estão ativos agora e em qual cena, sem precisar entrar em modo de supervisão/impersonação completo — um "radar" leve antes de decidir impersonar. Pode começar como polling simples (`updatedAt` da `Journey` recente) antes de evoluir para algo real-time.
*Esforço: baixo (versão polling) / médio (versão real-time com SSE) · Apoia-se em: `Journey.updatedAt`, `impersonatedPlayerId` já existente no `gameStore`.*

**14. Log de auditoria de ações administrativas — ✅ implementado (2026-09-16)**
Aba "Auditoria" no dashboard admin lista as últimas 100 ações administrativas (quem, o quê, quando, em qual jogador): mudança de acesso, banimento, reset de senha, início de supervisão, publicação/remoção do aviso global, envio de missiva individual e edição/reset do prompt narrativo. Guardado em `AuditLog`, sem foreign key para `Player` de propósito — o registro de um banimento precisa sobreviver à exclusão do jogador banido.
*Esforço: baixo · Apoia-se em: `AuditLog`, `src/lib/audit.ts`, `api/admin/audit-log/route.ts`.*

**15. Métricas de balanceamento de jogo**
Agregações sobre as `Scene`s já persistidas: taxa de falha em rolagens de dado, causas mais comuns de game over (`finalStatus`), distribuição de karma final, enigmas mais abandonados. Dado que já existe, só falta a agregação — útil para ajustar `CORE_MECHANICS.md` com dados reais em vez de intuição.
*Esforço: médio · Apoia-se em: `Scene`, `Journey.finalStatus`/`finalStatusHistory`.*

### Controle de conteúdo e configuração

**16. Editor de prompt/regras sem deploy — ✅ implementado (2026-09-16)**
Aba "Narrativa" no dashboard admin edita a persona do narrador e as 4 descrições de magnitude (curto/médio/longo/épico) mais diretrizes extras opcionais, guardadas em um `NarrativeConfig` singleton lido por `api/chat/route.ts` a cada requisição, com fallback para os defaults hardcoded quando não há override. Toda a lógica ligada ao `sceneSchema` (dado, puzzle, combate, mundo) continua fixa em código.
*Esforço: médio–alto · Apoia-se em: `NarrativeConfig`, `src/lib/narrativeDefaults.ts`, `api/admin/narrative-config/route.ts`.*

**17. Aviso global (MOTD/banner) — ✅ implementado (2026-09-16)**
Aba "Controles" no dashboard admin publica um aviso global (`Announcement` singleton) visto por todo jogador ao abrir o app, com variantes info/aviso/crítico. Estendido também para avisos individuais por jogador (`PlayerNotice`, enviados pela aba "Almas") e um histórico ("Missivas") no perfil do jogador.
*Esforço: baixo · Apoia-se em: `Announcement`, `PlayerNotice`, `AnnouncementBanner.tsx`.*

**18. Limites de orçamento por jogador**
Complementar ao item 3 do `ACTION_PLAN.md`: em vez de (ou além de) um rate limit técnico, dar ao admin um controle direto de "teto mensal de gasto estimado" por jogador BYOK/sistema, com aviso automático quando o teto é atingido.
*Esforço: médio · Apoia-se em: `Player.usageStats`, `apiEnabled`.*

**19. Ferramenta de correção de jornada travada**
Hoje o admin só tem `forcedNextAction`/`forcedEndingType` (força o *próximo* passo). Uma ferramenta complementar para editar diretamente um campo problemático de uma jornada travada (ex.: remover uma cena corrompida, resetar um status inconsistente) sem precisar mexer direto no banco — reduz a dependência de acesso a produção para casos de suporte.
*Esforço: médio · Apoia-se em: `gameStore.forcedNextAction`/`forcedEndingType`, `JourneyDetailsModal.tsx`.*

---

## Resumo

| # | Item | Frente | Esforço |
|---|------|--------|---------|
| 1 | Codex/Bestiário automático | Jogador | Médio |
| 2 | Resumo automático de capítulo | Jogador | Baixo–Médio |
| 3 | Forja de habilidades narrativa | Jogador | Médio |
| 4 | Timeline visual da jornada | Jogador | Médio |
| 5 | Entrada por voz | Jogador | Médio |
| 6 | Cartão de personagem compartilhável | Jogador | Baixo–Médio |
| 7 | Trilha sonora gerativa (fallback Spotify) | Jogador | Médio–Alto |
| 8 | Modo espectador (somente leitura) | Jogador | ✅ Implementado |
| 9 | Jornadas cooperativas | Jogador | Alto |
| 10 | Presets de acessibilidade | Jogador | ✅ Implementado |
| 11 | Narração em outros idiomas | Jogador | Médio |
| 12 | Dashboard de custo/uso | Admin | Médio |
| 13 | Monitor de sessões ao vivo | Admin | Baixo–Médio |
| 14 | Log de auditoria | Admin | ✅ Implementado |
| 15 | Métricas de balanceamento de jogo | Admin | Médio |
| 16 | Editor de prompt/regras sem deploy | Admin | ✅ Implementado |
| 17 | Aviso global (MOTD) | Admin | ✅ Implementado |
| 18 | Limites de orçamento por jogador | Admin | Médio |
| 19 | Correção de jornada travada | Admin | Médio |

**Candidatos de menor esforço/maior retorno imediato para começar:** #14 (log de auditoria), #17 (aviso global) e #10 (presets de acessibilidade) no lado rápido; #12 (dashboard de custo) e #2 (resumo de capítulo) como próximo passo de impacto médio.
