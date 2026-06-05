# 🔮 Plano de Ação: Descoberta Dinâmica de Modelos (Oráculo Vivo)

Este plano detalha a evolução do painel de configurações para que a lista de modelos de IA não seja mais estática, mas sim consultada em tempo real diretamente nos provedores (Google, OpenAI) usando as chaves do próprio usuário.

## 🎯 Objetivos
*   **Consulta em Tempo Real:** Identificar exatamente quais modelos a chave de API do usuário tem permissão para acessar.
*   **Ativação Condicional:** Só permitir a troca de modelos se o usuário configurar uma chave própria (BYOK). Do contrário, mantém-se o padrão seguro do sistema.
*   **Transparência de Acesso:** Mostrar ao usuário se a chave dele suporta modelos específicos (ex: GPT-4o, Gemini 1.5 Pro).

---

## 🏗️ Implementação Técnica

### 1. Backend: Proxy de Descoberta (`lib/ai/discovery.ts`)
Criar funções especializadas que consultam os endpoints de listagem de modelos de cada provedor:
*   **Google Gemini:** `https://generativelanguage.googleapis.com/v1beta/models?key=API_KEY`
*   **OpenAI:** `https://api.openai.com/v1/models` (filtrando por prefixos relevantes como `gpt-` ou `dall-e`).

### 2. Nova Rota de API: `GET /api/auth/profile/models`
Esta rota será responsável por:
1.  Recuperar as chaves criptografadas do usuário logado.
2.  Se houver chaves, disparar as consultas aos provedores.
3.  Retornar uma lista consolidada de modelos categorizados (Texto, Imagem, Áudio).

### 3. Frontend: Oráculo Adaptativo (`UserProfileModal.tsx`)
*   **Lógica de Gatilho:** Ao abrir a aba "Oráculo" ou ao salvar uma nova chave na aba "Canalização", o sistema dispara a busca por modelos disponíveis.
*   **Estado de Carregamento:** Feedback visual temático (ex: "Sintonizando com o Plano Astral...").
*   **Fallback Inteligente:** Se nenhuma chave pessoal for detectada, o seletor de modelos fica desativado ou exibe apenas a opção "Padrão do Reino" (System Default).

---

## 🚀 Fases de Execução

### Fase 1: Motor de Descoberta
1.  Implementar `lib/ai/discovery.ts` com suporte a Gemini e OpenAI.
2.  Criar a rota de API `/api/auth/profile/models`.
3.  Garantir que a descriptografia das chaves do usuário ocorra apenas no servidor durante a consulta.

### Fase 2: Interface Dinâmica
1.  Atualizar o estado do `UserProfileModal` para armazenar `availableModels`.
2.  Implementar a lógica de esconder/mostrar selects baseada na presença de chaves.
3.  Adicionar animações de carregamento para a descoberta dos modelos.

### Fase 3: Validação de Capacidades
1.  Filtrar modelos inúteis (ex: modelos de embedding ou moderadores) para manter a lista limpa e focada no jogo.
2.  Validar se a troca de modelo reflete instantaneamente na próxima cena gerada.

---
**Status:** Aguardando Aprovação para iniciar Fase 1.
**Localização do Arquivo:** `lifecycle/plans/plano_descoberta_dinamica_modelos.md`
