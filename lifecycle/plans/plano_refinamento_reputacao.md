# Plano: Refinamento do Sistema de Reputação e Fama

Este plano visa resolver o problema do painel de Influência vazio, garantindo que a IA gere dados granulares e que o frontend os exiba corretamente.

## 1. Instrução de IA (Backend)
- **Problema:** A IA está atualizando apenas a `moral` global.
- **Ação:** Atualizar o prompt soberano em `app/src/app/api/chat/route.ts` para exigir que atualizações morais venham acompanhadas de pelo menos uma entidade específica.
- **Nova Regra:** "Ao detectar uma interação social ou moral, você DEVE preencher `statusChanges.reputations` com o nome do NPC, Cidade ou Facção afetada."

## 2. Refatoração do Painel de Influência (UI)
- **Componente:** `app/src/components/game/InfluencePanel.tsx`.
- **Melhoria:** 
  - Adicionar um bloco de "Resumo da Alma" que exibe o Karma Global proeminentemente.
  - Implementar uma lógica de "Fallback": se a lista estiver vazia mas a moral global for diferente de zero, exibir uma entrada de "Reputação Mundial".
  - Corrigir a categorização para lidar com nomes dinâmicos vindos da IA.

## 3. Notificações e Toasts
- **Ação:** Garantir que o `page.tsx` dispare um toast específico para cada entrada no dicionário de reputações, não apenas para a moral global.

## 4. Estabilidade de Dados
- **Ação:** Garantir que no `gameStore.ts`, a ação `completeScene` faça o merge profundo do objeto de reputações, preservando valores antigos e somando os novos.

---
**Status da Investigação:** Confirmado no banco que `moral` é -5, mas `reputations` é `{}`. A IA precisa ser "forçada" a dar nome aos bois.
