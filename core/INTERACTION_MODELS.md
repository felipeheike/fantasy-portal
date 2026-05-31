# 🤖 Modelos de Interação com IA

O Fantasy Portal utiliza quatro modos principais de interação para garantir dinamismo e evitar a repetitividade.

## 1. ⚔️ Combined (Modo Tático)
O modo mais rico, utilizado em combates e exploração complexa.
- **Entradas:** Ação + Alvo + Item + Habilidade.
- **Requisito:** Pode exigir itens específicos (ex: Armas para golpear).
- **Visual:** Ativa o **TacticalGrid** (Mapa em Grade).

## 2. 🔢 Multiple (Escolha Múltipla)
Clássico de livros-jogo, com opções predefinidas.
- **Uso:** Decisões de caminho ou diálogos estruturados.
- **Variedade:** Ternário ou Quaternário.

## 3. ⚖️ Binary (Escolha Simples)
Decisões críticas de Sim ou Não.
- **Uso:** Aceitar missões ou atravessar portais de não-retorno.

## 4. 🎭 Interpretative (Roleplay Livre)
Entrada de texto livre para total liberdade criativa.
- **Uso:** Dilemas morais profundos e interações complexas com NPCs.

---
**Regra de Alternância:** O sistema é configurado via `.env` (`MAX_REPETITIVE_INTERACTIONS`) para forçar a IA a alternar entre esses modos, garantindo uma jornada sempre fresca.
