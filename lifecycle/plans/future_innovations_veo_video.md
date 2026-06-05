# Plano de Inovação: Geração de Vídeo Atmosférico (Veo 3.1)

## Objetivo
Elevar a imersão do Fantasy Portal integrando o modelo de geração de vídeo **Veo 3.1** do Google. A ideia é gerar pequenos clipes de vídeo ambientais (de 4 a 6 segundos) que ilustrem momentos-chave da jornada, em substituição ou adição às imagens estáticas.

## Contexto Técnico Atual
- **Modelos Disponíveis (Gemini API):** 
  - `veo-3.1-generate-preview` (Alta Fidelidade / 4K)
  - `veo-3.1-fast-generate-preview` (Rápido, menor latência)
  - `veo-3.1-lite-generate-preview` (Custo-eficiente, para alto volume)
- **Desafio Arquitetural (Assincronicidade):** Ao contrário do `gemini-1.5-flash` para imagens ou do `gemini-2.5-flash-preview-tts` para áudio, que retornam a resposta imediatamente, a geração de vídeo do Veo é um processo de longa duração (Long-Running Operation). Um vídeo pode levar cerca de 80 a 100 segundos para ser renderizado.

## Estratégia de Implementação (Proposta)

### 1. Gatilho Estratégico (Otimização de Custos)
Devido ao alto consumo de créditos/tempo, os vídeos não devem ser gerados em *todas* as cenas.
- **Regra Sugerida:** Gerar vídeos apenas no início de novos capítulos, em batalhas contra chefes (Boss Fights), ou finais épicos (`isGameOver` e Glória). As cenas intermediárias continuam usando o `imagen-3` para imagens estáticas.

### 2. Modificação da API (`/api/vision` ou nova `/api/video`)
Criaremos uma rota assíncrona focada em Polling.
- O Frontend fará um POST com o `visualDescription`.
- O Backend iniciará a operação no `genai.Client` (`client.models.generate_videos`) e salvará no banco de dados (ou retornará imediatamente ao Frontend) o `operation_id`.
- O Frontend passará a exibir um estado de "Renderizando Visão Profunda..." e fará *polling* (ex: a cada 10 segundos) verificando se a operação foi concluída (`client.operations.get(operation)`).

### 3. Integração com o Narrador
- O Veo 3.1 suporta *Text-to-Video* e pode receber imagens como referência (*Ingredients to Video*). Poderemos alimentar a geração com o avatar do jogador ou com a imagem da cena anterior para garantir consistência visual no estilo artístico escolhido (Pixel-Art, Dark-Realism, etc).
- O arquivo `.mp4` retornado será transferido e salvo no bucket do MinIO, semelhante ao que já fazemos com as imagens, e seu link será persistido na coluna (que deverá ser criada) `videoUrl` na tabela `NarrativeScene`.

### 4. Interface do Usuário (`NarrativePanel.tsx`)
- Adição de um `<video>` player com atributos `loop`, `muted` (ou com áudio nativo do Veo) e `playsInline`.
- Criar a transição suave de carregamento: enquanto o vídeo estiver gerando nos bastidores da API (pelos 100s), a interface pode mostrar inicialmente uma imagem borrada ou o texto narrativo, revelando o vídeo quando o polling for concluído.

## Conclusão
Essa integração elevará a narrativa a um estilo cinemático AAA. Requer cuidado extra no gerenciamento de UI (estados de carregamento longos) e uso responsável dos créditos de API, priorizando o modelo `lite` ou `fast` para o gameplay diário.