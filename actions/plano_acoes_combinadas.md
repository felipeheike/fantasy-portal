# Plano de Ação: Gerenciamento de Inventário e Durabilidade

## Objetivo
Aprimorar o sistema de Ações Combinadas para que o uso de itens reflita automaticamente no inventário do jogador (via IA), e implementar a funcionalidade de descarte manual de itens pelo jogador, respeitando um limite de capacidade.

## Regras de Negócio Definidas
1. **Consumo e Durabilidade:** A IA é o árbitro final do sucesso de uma ação. O consumo de itens e redução de durabilidade serão enviados pela IA via JSON para evitar que o jogador perca itens em ações mal sucedidas.
2. **Capacidade do Inventário:** O inventário passará a ter um limite máximo de itens.
3. **Descarte Manual:** O jogador poderá descartar itens manualmente a qualquer momento para abrir espaço.
4. **Proteção de Itens de Missão:** Itens do tipo `quest` são bloqueados. Eles não podem ser descartados manualmente pelo jogador e só serão subtraídos pela IA quando a missão em questão for concluída.

## Proposta de Implementação

### 1. Atualização de Tipagens (`app/src/types/index.ts`)
```typescript
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number; 
  type: 'weapon' | 'armor' | 'consumable' | 'quest';
  durability?: number;    // Uso atual
  maxDurability?: number; // Uso máximo
}
```

### 2. Atualização dos Prompts do Game Master (`Prompts/Prompt Inicial.md` e `JSON SET.md`)
*   **Consumíveis (`consumable`):** Se a ação for resolvida com sucesso, a IA decreta o gasto removendo o `id` em `inventoryChanges.removed` (ou atualizando a quantidade em `added`).
*   **Itens de Missão (`quest`):** Se cumprir seu objetivo, a IA deve enviá-lo em `inventoryChanges.removed`.
*   **Equipamentos (`weapon`, `armor`):** Sempre que utilizado ativamente em combate, a IA diminui sua `durability`. Se chegar a `0`, a IA narra a quebra e o adiciona em `removed`.

### 3. Melhorias no Estado Global (`store/gameStore.ts`)
*   Adicionar controle de capacidade (ex: checar se o inventário está cheio antes de `addItem`).
*   Criar ou ajustar a ação `discardItem(itemId: string)` para o Client.
*   Ajustar o processamento da `completeScene` para permitir que o array `added` atualize as informações (fazer um merge da `durability`) de itens já existentes em vez de apenas inseri-los novamente.

### 4. Melhorias na UI (`InventoryPanel.tsx` e `ActionOrchestrator.tsx`)
*   Exibir o limite de capacidade no topo (ex: "Inventário (8/10)").
*   Para itens com `maxDurability`, exibir um contador ou barra visual.
*   Adicionar um botão de "Lixeira/Descartar" ao lado de cada item no inventário.
*   **Ocultar o botão de descarte se `item.type === 'quest'`.**