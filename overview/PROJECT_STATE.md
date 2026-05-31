# Fantasy Portal - Análise Completa do Estado Atual (As-Is)

Este documento descreve as funcionalidades, arquitetura e estado atual do projeto Fantasy Portal, consolidando todas as implementações realizadas até o momento.

## 🕹️ Core Gameplay & Mecânicas de RPG

### 1. Sistema de Status Dinâmico (`player_status`)
*   **Gestão de Recursos:** Controle em tempo real de HP, SP e Poder de Combate.
*   **Regras de Punição:** Modos de falha configuráveis (Tolerância 3/5, No Fail, Permadeath).
*   **Mecânica de Ferimentos:** Sistema que impacta a narrativa se o dano for severo.

### 2. Inventário Inteligente
*   **Tipagem de Itens:** Suporte para Armas, Armaduras, Consumíveis e Itens de Missão.
*   **Empilhamento (Stacking):** Itens com o mesmo ID são fundidos automaticamente incrementando a quantidade.
*   **Durabilidade:** Equipamentos sofrem desgaste com o uso, podendo quebrar narrativamente.
*   **Capacidade Máxima:** Limite de 10 slots com feedback visual de ocupação.
*   **Item Lock:** Trava de segurança que impede o descarte de itens que estão sendo usados em uma ação tática ativa.

### 3. Sistema de Habilidades (Disciplinas)
*   **Progressão Real:** Habilidades saíram do estado "mock" para um sistema dinâmico de evolução (Level Up) gerido pela IA.
*   **Rank de Poder:** Classificação geral do personagem (Rank F ao S) calculada automaticamente com base na soma dos níveis das habilidades.
*   **Mini-HUD:** Exibição rápida de ícones e níveis na barra de status superior.

---

## 🤖 Inteligência Artificial & Arquitetura

### 4. Orquestração Multi-Provedor
*   **Cérebro Flexível:** Arquitetura que permite alternar entre **Google (Gemini)**, **OpenAI (GPT)** e **Anthropic (Claude)** apenas via `.env`.
*   **Fábrica de Modelos:** Camada centralizada em `lib/ai/providers.ts` que abstrai a complexidade dos SDKs.

### 5. Fluxo de Geração de Mídia Assíncrona
*   **Dois Motores:** Separação do modelo de narrativa (texto rápido) do modelo de ilustração (qualidade visual).
*   **Endpoint `/api/image`:** Geração de imagens via Vercel AI SDK (usando Imagen-3 ou DALL-E).
*   **Canvas com Recovery:** Se a ilustração falhar, um botão de "Tentar Novamente" aparece no canvas para re-geração manual sem quebrar a história.

### 6. Monitoramento do Mestre
*   **Dashboard Técnico:** Painel que exibe modelo ativo, provedor, latência em tempo real e status da API para texto e imagem.

---

## 🖥️ Interface & UX/UI

### 7. Painéis de Jogo
*   **NarrativePanel:** Scroll infinito da história, exibição de imagens em alta definição e registro de escolhas.
*   **ActionOrchestrator:** Interface tática para "Ações Combinadas" (Ação + Alvo + Item/Skill).
*   **Inventory & Skills Panels:** Modais deslizantes para gestão detalhada de recursos.

### 8. Exportação de Crônicas
*   **Markdown Estilizado:** Botão para exportar a lenda inteira do jogador em formato `.md`, organizado por capítulos, com emojis temáticos baseados no gênero da jornada.

---

## 💾 Persistência & Infraestrutura
*   **Banco de Dados:** Prisma + PostgreSQL para salvar jornadas, histórico e status.
*   **State Management:** Zustand com persistência no LocalStorage para hidratação rápida e sincronização com o banco.
*   **Deployment Ready:** Configuração completa com Docker Compose para App, DB, Redis e pgAdmin.
