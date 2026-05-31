# Plano: Implementação de Inovações e Incrementos (Pontos 4 a 7)

Este plano detalha a estratégia para implementar a segunda metade das inovações sugeridas para o Fantasy Portal, focando em visualização tática, conectividade e exportação profissional.

## Fase 1: Finalização e Expansão (Pontos 6 e 7)
*Foco: Entrega de valor imediato e uso da infraestrutura de armazenamento já existente.*

### 1.1 Geração de PDF de Arte - "The Legend's Book" (Ponto 6)
- **Objetivo:** Criar um registro físico/digital da jornada do jogador.
- **Execução:**
  - Integrar uma biblioteca de geração de PDF (ex: `jsPDF` no cliente ou `react-pdf`).
  - Criar um template elegante que intercale os textos das cenas com as imagens geradas salvas no MinIO.
  - Incluir uma página de "Status Final" com as estatísticas, Karma e Disciplinas.
- **Sugestão de Procedimento:** Iniciar por aqui, pois é um recurso de "fim de jogo" que aumenta o engajamento social.

### 1.2 Integração Multimodal "Olho do Mestre" (Ponto 7)
- **Objetivo:** Permitir que o jogador insira objetos do mundo real na narrativa.
- **Execução:**
  - Criar um componente de upload no frontend vinculado à lib `storage.ts`.
  - Implementar API `/api/vision` que utiliza o modelo multimodal do Gemini para analisar a imagem.
  - A IA deve gerar uma "ficha de item RPG" baseada no objeto real e injetá-la no inventário via `inventoryChanges`.
- **Sugestão de Procedimento:** Paralelizar com o Ponto 6, aproveitando que o MinIO já está configurado.

## Fase 2: Experiência Visual e Tática (Ponto 4)
*Foco: Transformar a mecânica de combate de texto para visual.*

### 2.1 Batalhas Táticas Visualizadas (Grid-based Combat)
- **Objetivo:** Interface de combate em grade (grid) com movimentação e posicionamento.
- **Execução:**
  - Criar um novo componente `TacticalGrid.tsx` usando Canvas ou SVG.
  - IA deve retornar coordenadas iniciais no JSON de cena quando a tag `combate` estiver ativa.
  - **Sprites:** Solicitar à IA de imagem a geração de sprites ou ícones específicos para monstros (`pixel-art` ou `top-down`).
- **Sugestão de Procedimento:** Requer uma refatoração no `ActionOrchestrator` para lidar com estados de posição.

---

## Roteiro de Execução Sugerido

1.  **Semana 1 (Visão e PDF):** Implementar o upload de fotos (Ponto 6) e a exportação para PDF (Ponto 5). São recursos independentes que não quebram o fluxo atual.
2.  **Semana 2 (Combate Tático):** Desenvolver a lógica de grid e sprites. Isso mudará a forma como o jogador interage com as cenas de ação.


**Próximo Passo Recomendado:** Começar pelo **Ponto 7 (Olho do Mestre)**, pois expande a jogabilidade de forma mágica e utiliza a infraestrutura de MinIO que acabamos de subir.
