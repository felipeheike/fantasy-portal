# Plano: Implementação de Controles de Economia de Cota

Este plano descreve a adição de controles para habilitar ou desabilitar a geração de **Imagens** e **Áudio (TTS)**, permitindo que o usuário gerencie o consumo de API e continue jogando mesmo sob restrições de cota.

## 1. Atualização do Modelo e Estado
- **Types:** Adicionar `enableImages` (boolean) e `enableAudio` (boolean) ao objeto `JourneySettings`.
- **GameStore:** Atualizar o estado inicial e as ações de configuração para incluir esses novos campos.

## 2. Configuração Inicial (5 Steps de Criação)
- Modificar o `JourneySetup.tsx` para incluir um novo passo ou integrar os toggles nos passos existentes.
- **Sugestão:** Adicionar no último passo (Step 5 - Estilo de Leitura) ou criar um passo final focado em "Recursos de Imersão".

## 3. Gestão em Tempo Real (Configurações da Jornada)
- Atualizar o `JourneyDetailsModal.tsx` para permitir que o usuário ligue/desligue esses recursos a qualquer momento durante a aventura.

## 4. Lógica de Execução (Frontend)
- Modificar o `page.tsx` no callback `onFinish` do `useObject`:
  - Somente disparar `generateSceneImage` se `settings.enableImages` for true.
  - Somente disparar `generateSceneAudio` se `settings.enableAudio` for true.

## 5. Benefícios
- **Economia:** Otimiza o uso de chaves de API gratuitas.
- **Continuidade:** O jogo não trava ou exibe erros constantes de imagem se o usuário optar por seguir apenas via texto.
- **Autonomia:** O usuário decide o nível de imersão desejado.

---
**Nota:** O usuário mencionou "geração de texto", mas como o jogo é 100% dependente da IA de texto para existir, interpretarei como "Geração de Áudio (Narração)" para viabilizar a jogabilidade econômica. Se for desejado um modo "Offline", isso exigiria modelos locais (Ollama), o que foge ao escopo imediato.
