# Plano: Diário de Batalha e Vigor (Status Log)

Este plano descreve a implementação de um rastreador detalhado de mudanças de status, permitindo que o jogador entenda exatamente como e por que sua Vitalidade (HP) e Estamina (SP) variaram ao longo da jornada.

## 1. Estrutura de Dados e Persistência
- **Types:** Criar a interface `StatusLogEntry` contendo:
  - `id`, `type` (HP/SP), `change` (valor +/-), `source` (nome do monstro, item ou ação), `timestamp` e `sceneId`.
- **GameStore:** Adicionar o array `statusHistory` e lógica para registrar entradas automaticamente toda vez que o status for alterado.

## 2. Inteligência da IA (Backend)
- **Schema:** Adicionar o campo `source` dentro de `statusChanges` no arquivo `app/src/app/api/chat/route.ts`.
- **Prompt:** Instruir o Narrador a sempre especificar a fonte da alteração (ex: "Garra do Espectro", "Esforço de Salto", "Poção de Cura").

## 3. Painel de Histórico (UI)
- Criar `StatusLogPanel.tsx`:
  - Listagem elegante com cores semânticas:
    - **Vermelho:** Dano recebido.
    - **Verde:** Cura/Recuperação.
    - **Azul:** Gasto de fôlego (Estamina).
    - **Ciano:** Recuperação de vigor.
  - Exibição do "Saldo da Cena" para facilitar a compreensão.

## 4. Gatilhos de Acesso
- **PlayerStatusBar:**
  - Transformar as seções de Vitalidade e Estamina em botões clicáveis.
  - Ao clicar na barra de HP, abre o painel focado em Vitalidade.
  - Ao clicar na barra de SP, abre o painel focado em Estamina.

## 5. Benefícios
- **Transparência:** O jogador entende as regras matemáticas por trás da narração.
- **Estratégia:** Ajuda a identificar quais monstros são mais perigosos e quais ações consomem mais recursos.
- **Imersão:** Funciona como um "Log de Combate" clássico de RPGs de mesa.

---
**Próximo Passo:** Se aprovado, iniciarei a atualização do schema da IA e a criação do componente de Log.
