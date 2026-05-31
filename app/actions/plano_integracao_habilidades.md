# Plano de Ação: Integração Funcional do Sistema de Habilidades (Finalizado)

## Objetivo
Tornar o sistema de Habilidades (Skills) totalmente funcional, dinâmico e visível na interface. As habilidades agora afetam resoluções, podem evoluir de nível e são monitoradas em tempo real pelo jogador.

## Implementações Realizadas

### 1. Backend & Inteligência Artificial
*   **Schema da API:** Adicionado campo `skillChanges` ao Zod Schema (`route.ts`).
*   **Prompt de Sistema:** Instruído o Mestre de Jogo a usar habilidades existentes como modificadores de sucesso e a não inventar habilidades fora da ficha.
*   **Evolução:** A IA agora tem autoridade para conceder novas habilidades ou subir o nível das atuais via JSON.

### 2. Estado Global (`gameStore.ts`)
*   **Lógica de Merge:** Implementada a fusão de habilidades. Se a IA retornar uma habilidade já possuída, o sistema atualiza o nível (`level`) e descrição. Caso contrário, uma nova habilidade é injetada na ficha.
*   **Persistência:** O estado das habilidades é salvo no banco de dados (Prisma) e sincronizado automaticamente.

### 3. Interface do Usuário (UI/UX)
*   **Mini-HUD de Disciplinas:** Adicionado um agrupamento de ícones na `PlayerStatusBar` que mostra as 4 primeiras habilidades do jogador com seus respectivos níveis.
*   **Botão de Atalho:** Adicionado um ícone de centelha (`Sparkles`) explícito na barra de status para abrir o painel de habilidades, melhorando a descoberta.
*   **Refatoração do Painel:** O `SkillsPanel` agora é 100% dinâmico, mostrando barras de progresso reais e estrelas de maestria baseadas no `level`.

### 4. Orquestrador Tático
*   **Filtragem Estrita:** O menu de Ações Combinadas agora sugere apenas habilidades que o jogador realmente possui no estado global.
*   **Feedback de Bloqueio:** Integrado ao sistema de Item Lock para garantir consistência durante o turno.

## Próximos Passos Sugeridos
*   Implementar "Habilidades Passivas" que alteram visualmente opções de diálogo (ex: Opções que só aparecem se tiver Skill X).
*   Adicionar efeitos sonoros ou animações de "Level Up" quando uma habilidade evoluir.
