# Relatório de Conclusão: Controle de Cota e Gestão de Sessões

Este relatório resume as melhorias implementadas para otimizar o uso de APIs e a gerência de jornadas no Fantasy Portal.

## 1. Sistema de Economia de Cota
- **Funcionalidade:** Toggles para habilitar/desabilitar **Ilustrações por IA** e **Narração por Áudio (TTS)**.
- **Implementação:**
  - Adicionado ao Passo 5 do `JourneySetup`.
  - Adicionado ao `JourneyDetailsModal` (Engrenagem) para ajuste em tempo real.
  - O motor do jogo (`page.tsx`) agora verifica estas flags antes de disparar requisições para as APIs `/api/image` e `/api/audio`.

## 2. Gestão de Sessões Salvas (Menu Principal)
- **Funcionalidade:** Acesso rápido às configurações de uma jornada salva sem precisar carregá-la.
- **Implementação:**
  - Novo botão de **Engrenagem** adicionado ao lado do ícone de lixeira em cada card de jornada no `MainMenu`.
  - Permite visualizar estatísticas e alterar as preferências de cota/imersão antes de iniciar a sessão.

## 🛠️ Detalhes Técnicos
- **Estado:** `gameStore` atualizado com a ação `updateSettings`.
- **Persistência:** As configurações de cota são enviadas ao servidor durante o ciclo de sincronização (PATCH).
- **Tipagem:** `JourneySettings` estendido para incluir `enableImages` e `enableAudio`.

---
**Status Final:** O sistema está mais econômico e flexível, permitindo jogar apenas via texto quando a cota de IA estiver baixa, sem perder a imersão textual e tática.
