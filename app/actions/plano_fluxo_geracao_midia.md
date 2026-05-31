# Plano de Ação: Fluxo de Geração de Mídia e Separação de Modelos (Finalizado)

## Objetivo
Implementar um fluxo de geração de ilustrações assíncrono e desacoplado da narrativa principal, permitindo o uso de modelos especializados para cada tarefa.

## Implementações Realizadas

### 1. Configuração de Modelos (`.env`)
*   Separadas as responsabilidades entre modelos:
    *   `GOOGLE_MODEL="gemini-3.1-flash-lite"`: Responsável pela narrativa, lógica de RPG e regras.
    *   `GOOGLE_IMAGE_MODEL="gemini-2.5-flash-image-preview"`: Responsável exclusivamente pela geração visual.

### 2. Backend - Rota de Imagem (`/api/image`)
*   Criado um novo endpoint utilizando `experimental_generateImage` da Vercel AI SDK.
*   Otimizada para lidar com tempos de resposta de até 60 segundos.
*   Retorna a imagem como um `Uint8Array` (PNG), garantindo compatibilidade com o frontend.

### 3. Estado Global (`gameStore.ts`)
*   Implementada a action `updateSceneImage(sceneId, imageUrl)`.
*   Esta função permite injetar o URL da imagem gerada em uma cena específica do histórico, disparando a transição visual suave de "Carregando" para "Imagem" sem recarregar a história.

### 4. Orquestração no Frontend (`page.tsx`)
*   **Fluxo Assíncrono:** Ao finalizar a geração do texto da cena, o sistema inicia automaticamente uma chamada em background para o endpoint de imagem.
*   **Não-Bloqueante:** O jogador pode ler a narração e fazer suas escolhas enquanto a ilustração é processada nos bastidores.
*   **Injeção Dinâmica:** Assim que o processamento termina, a imagem aparece magicamente na cena correspondente.

## Vantagens Finais
*   **Velocidade:** O texto aparece muito mais rápido para o jogador.
*   **Estética:** Uso de modelos Gemini especializados em imagem para maior fidelidade visual.
*   **Consistência:** As ilustrações permanecem vinculadas às suas respectivas cenas no histórico.
