# Plano: Melhoria das Ações Combinadas (Requisitos e Filtragem)

Este plano descreve a implementação de um sistema de validação inteligente para as ações táticas ("Combined Mode"), garantindo que ações específicas exijam o uso de itens ou habilidades, enquanto outras permanecem livres.

## 1. Atualização do Modelo de Dados (Tipos)
- Adicionar campos `requiresItem` (boolean) e `itemType` (opcional) às definições de ação no arquivo `app/src/types/index.ts`.
- Isso permitirá que o frontend saiba se uma ação está "bloqueada" aguardando uma escolha de item.

## 2. Instrução do Narrador (IA Backend)
- Modificar o prompt soberano em `app/src/app/api/chat/route.ts`.
- Ensinar a IA a classificar as ações geradas:
  - **Ações de Ataque/Uso:** Devem vir com `requiresItem: true`.
  - **Ações de Movimento/Esquiva/Inatas:** Devem vir com `requiresItem: false`.
- Adicionar metadados de categoria para filtrar a mochila do jogador (ex: mostrar apenas armas para a ação "Golpear").

## 3. Inteligência na Interface (UI Frontend)
- Refatorar `app/src/components/game/ActionOrchestrator.tsx`:
  - **Trava de Segurança:** O botão "Executar Ação" permanecerá desativado se uma ação exigir um item e nenhum estiver selecionado.
  - **Destaque Visual:** Mostrar indicadores (ex: um ícone de cadeado ou cor de alerta) na coluna de itens quando a ação selecionada exigir um.
  - **Seleção Inteligente:** Se o jogador selecionar um item que não condiz com a ação (ex: uma maçã para um golpe), a IA tratará a interpretação, mas o frontend pode sugerir os tipos corretos.

## 4. Benefícios
- **Clareza:** O jogador não ficará confuso sobre quando precisa ou não clicar em um item.
- **Imersão:** A interface reage dinamicamente às intenções táticas do herói.
- **Redução de Erros:** Menos ações inválidas enviadas para a IA.
