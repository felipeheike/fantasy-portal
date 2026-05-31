# Plano de Ação: Questionamentos ao Mestre (Inquiries)

Este plano descreve a implementação de um sistema que permite ao jogador interrogar o Narrador (IA) para obter mais contexto sobre a cena atual antes de tomar uma decisão crítica, adicionando uma camada estratégica de investigação.

## 1. Mecânica de "Pontos de Visão" (Insight Points)
Para evitar que o jogador peça para a IA resolver todos os enigmas, limitaremos essa ação.
- **Métrica:** Adicionar `insightPoints` no `PlayerStatus` (Padrão: 3 cargas).
- **Consumo:** Cada pergunta consome 1 ponto.
- **Recuperação:** Os pontos não se regeneram sozinhos, mas podem ser recompensados pela IA em cenas raras ou ao descansar.

## 2. API de Elucidação (Backend)
Precisamos de uma rota separada que NÃO avance a história, apenas analise o contexto.
- **Rota:** `POST /api/chat/inquiry`
- **Comportamento:** A IA receberá a narração atual, o histórico recente e a pergunta do usuário.
- **Prompt Especializado:** A instrução forçará a IA a ser *"Evasiva, porém útil"*. Ela deve explicar conceitos do lore, detalhes visuais não descritos ou as emoções do protagonista, mas NUNCA deve dar a resposta exata de "qual é a opção certa".
- **Retorno:** Apenas um texto formatado em Markdown, sem atualizar o banco de dados da jornada.

## 3. Interface de Interrogação (UI)
- **O Botão Flutuante:** Um botão com ícone de Ponto de Interrogação ou "Olho de Hórus" flutuando no lado esquerdo da tela (abaixo dos efeitos de dano/reputação). Ele exibirá o número de cargas restantes.
- **O Painel de Dúvidas (`InquiryPanel.tsx`):**
  - Ao clicar, abre um painel modal elegante.
  - Um campo de texto para digitar a pergunta.
  - Ao enviar, o botão exibe um estado de carregamento.
  - A resposta da IA aparece logo acima, como um sussurro do mestre (estilo pergaminho).

## 4. Evolução do Banco de Dados (Prisma)
- **Alteração no `status` do Player (JSON):** 
  - Não requer alteração direta no schema Prisma, apenas na tipagem TypeScript (`insightPoints: number`), já que é um campo dinâmico do JSON.

## 5. Roteiro de Execução
1. Atualizar o `types/index.ts` e `gameStore.ts` para suportar e iniciar o jogo com `insightPoints = 3`.
2. Criar a rota especializada `app/src/app/api/chat/inquiry/route.ts`.
3. Desenvolver o componente `InquiryPanel.tsx`.
4. Incorporar o botão flutuante no layout do `page.tsx` (lado esquerdo).
5. Criar notificações Toast para avisar quando um Ponto de Visão for gasto.

---
**Resultado Esperado:** O jogador terá a oportunidade de pausar e refletir, gastando um recurso valioso para desvendar as entrelinhas da história escrita pela IA, aumentando substancialmente a profundidade interpretativa do RPG.
