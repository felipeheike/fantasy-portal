# Plano: Sistema de Reputação Localizada e Influência

Este plano descreve a evolução do sistema de Karma para um modelo granular, onde o jogador possui reputações distintas com NPCs, Facções e Cidades, além de novas animações de imersão.

## 1. Modelo de Dados e Estado (Fase 1)
- **Types:** Atualizar `PlayerStatus` para incluir `reputations: Record<string, number>`.
- **GameStore:** Implementar lógica para somar/subtrair reputações específicas e calcular a média para o Karma Global.

## 2. Feedback Visual de Alma (Fase 2)
- **ScreenEffects:**
  - **Ação Heroica (+):** Flash **Dourado/Branco** etéreo indicando ganho de reputação positiva.
  - **Ação Vilanesca (-):** Vignette **Roxa/Sombria** profunda indicando perda de reputação ou ganho de infâmia.

## 3. Painel de Influência (UI) (Fase 3)
- Criar `InfluencePanel.tsx`:
  - Listagem categorizada de todos os seres e lugares afetados pelas escolhas do jogador.
  - Barras de progresso individuais (ex: "Vila de Alvorada: Respeitado [+15]").
- **Trigger:** Adicionar botão de acesso (ícone `Scale` ou `Users`) na `PlayerStatusBar`.

## 4. Inteligência do Narrador (Fase 4)
- Atualizar o prompt soberano para detectar interações sociais complexas.
- IA deve retornar atualizações no formato: `statusChanges: { moral: +X, reputations: { "NPC_Nome": +Y } }`.

## 5. Benefícios
- **Profundidade:** O jogador pode ser um herói para o povo, mas um vilão para as autoridades.
- **Reatividade:** NPCs podem se recusar a falar ou oferecer descontos baseados na reputação local.
