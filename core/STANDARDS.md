# 🛠️ Padrões e Nomenclaturas (STANDARDS)

Este documento define os padrões técnicos para garantir a harmonia entre o código (Next.js/Prisma) e o motor de IA.

## 🔤 Nomenclaturas Obrigatórias (CamelCase no Código, JSON)

| Termo | Descrição |
| :--- | :--- |
| `sceneId` | Identificador único e descritivo da cena. |
| `narration` | Texto literário da cena em PT-BR. |
| `visualDescription` | Prompt detalhado para geração de imagem. |
| `audioDescription` | Descrição do clima sonoro para TTS. |
| `recommendedInputType` | Tipo de interação (binary, multiple, combined, interpretative). |
| `statusChanges` | Objeto com HP, SP, Moral e Reputations. |
| `worldUpdate` | Objeto com Flags e Memories. |

## 📐 Contrato de Dados (JSON Schema)
Todas as respostas da IA devem seguir rigorosamente o `sceneSchema` definido no backend, garantindo que o frontend consiga processar mudanças de status e inventário sem falhas.

## 🌍 Alinhamento de Idioma
- **Backend/JSON:** Sempre em Inglês.
- **Narrativa/Frontend:** Sempre em Português (PT-BR).
