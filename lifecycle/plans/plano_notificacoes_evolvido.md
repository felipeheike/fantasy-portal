# Plano: Sistema de Notificações Evoluído (Reatividade Total)

Este plano expande o sistema de notificações (Toasts) para fornecer feedback imediato sobre todas as mecânicas vitais do jogo, aumentando a percepção de causa e consequência.

## 1. Notificações de Equipamento e Uso
- **Uso de Consumíveis:** Exibir toast ao remover itens do inventário (ex: "🧪 Poção de Sangue Seco consumida").
- **Quebra de Itens:** Monitorar a durabilidade. Se um item for removido e seu status anterior era de baixa durabilidade, ou se a IA indicar quebra, alertar (ex: "⚔️ Sua Espada Enferrujada se partiu em pedaços!").

## 2. Notificações de Reputação e Influência
- **Fama Local:** Sempre que o objeto `reputations` for alterado, exibir a variação (ex: "⚖️ Sua fama em Vila de Alvorada aumentou [+5]").
- **Karma Global:** Notificar mudanças significativas no alinhamento moral (ex: "🌟 Sua alma brilha com um ato de bondade").

## 3. Notificações Narrativas (Sugestões Extras)
- **World Knowledge:** Notificar quando um fato importante é registrado nas memórias (ex: "📜 Fato registrado: Você poupou a vida da Sombra").
- **Mudanças de Mundo (Flags):** Notificar eventos permanentes (ex: "🚩 O destino mudou: A taverna foi selada").
- **Avisos de Perigo:** Alertar quando o HP entrar em estado crítico ou o SP zerar (ex: "🩸 Vitalidade Crítica!").

## 4. Implementação Técnica
- Criar um helper `toastManager.ts` para padronizar ícones e cores para cada tipo de evento.
- Integrar os gatilhos no `onFinish` do `page.tsx` comparando o estado anterior e o novo estado recebido da IA.

## 5. Benefícios
- **Feedback Imediato:** O jogador percebe o impacto de suas decisões sem precisar abrir menus.
- **Imersão:** A interface "conversa" com o jogador através de alertas temáticos.
- **Clareza de Regras:** Torna explícito o consumo de recursos e mudanças de status.
