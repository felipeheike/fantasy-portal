# Plano de Ação: Suporte a Múltiplos Provedores de IA (Finalizado)

## Objetivo
Implementar uma arquitetura flexível que permite alternar dinamicamente entre Google, OpenAI e Anthropic para texto, e Google/OpenAI para imagens, via variáveis de ambiente.

## Implementações Realizadas

### 1. Centralização da Inteligência (`providers.ts`)
*   Criada a "Fábrica de Modelos" em `lib/ai/providers.ts`.
*   Esta camada abstrai qual SDK está sendo usada, entregando apenas a instância configurada para as rotas.
*   Suporte inicial: **Google (Gemini/Imagen)**, **OpenAI (GPT/DALL-E)** e **Anthropic (Claude)**.

### 2. Configuração Dinâmica (`.env`)
*   Novas variáveis introduzidas:
    *   `ACTIVE_TEXT_PROVIDER`: Controla o "cérebro" da narrativa.
    *   `ACTIVE_IMAGE_PROVIDER`: Controla o "olho" da ilustração.
    *   `TEXT_MODEL` e `IMAGE_MODEL`: Permitem trocar versões dos modelos (ex: `gpt-4o` vs `gpt-4o-mini`) sem tocar no código.

### 3. Refatoração de Rotas
*   `api/chat/route.ts`: Agora utiliza `getTextModel()`. Removidos imports diretos e lógicas fixas de provedor.
*   `api/image/route.ts`: Agora utiliza `getImageModel()`. Se configurado para OpenAI, usará automaticamente o DALL-E 3.
*   `api/ai-status/route.ts`: Atualizado para reportar os provedores ativos no painel de monitoramento.

### 4. Interface de Monitoramento
*   `JourneyDetailsModal.tsx`: Atualizado para mostrar o nome do provedor ao lado do modelo (ex: "Narrativa — openai | gpt-4o").

## Como Adicionar Novos Provedores (Ex: Leonardo, Pollinations)
1.  Instale o provider correspondente da Vercel AI SDK (ex: `npm install @ai-sdk/leonardo`).
2.  Importe o provider no `lib/ai/providers.ts`.
3.  Adicione um novo `case` no `switch` da função `getTextModel` ou `getImageModel`.
4.  Atualize o tipo `TextProvider` / `ImageProvider` no topo do arquivo.

## Vantagens Finais
*   **Independência de Cota:** Se o Gemini atingir o limite, basta mudar o `.env` para `openai` ou `anthropic`.
*   **Qualidade sob Demanda:** Possibilidade de usar o Claude 3.5 Sonnet para narrativas mais literárias e complexas.
