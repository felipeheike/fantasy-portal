
### 🧩 **1. Estruturais (definem o tipo da cena)**

| Tag          | Uso                                                      |
| ------------ | -------------------------------------------------------- |
| `introducao` | Primeiro bloco da jornada; configura mundo e personagem  |
| `evento`     | Algo acontece com ou sem escolha direta                  |
| `descoberta` | Revelação de algo importante (lore, mapa, segredo, etc.) |
| `transicao`  | Movimento de uma área para outra                         |

---

### ⚔️ **2. Mecânicas (ativam sistemas do jogo)**

| Tag               | Uso                                                         |
| ----------------- | ----------------------------------------------------------- |
| `combate`         | Ativa motor de combate; entrada combinada                   |
| `encontro_npc`    | NPC interage; diálogo ou ação social                        |
| `uso_item`        | Cena exige ou sugere uso de item específico                 |
| `exploracao`      | Ambiente interativo; pode conter armadilhas ou pistas       |
| `decisao_simples` | Caminhos ou ações rápidas; escolhas binárias ou múltiplas   |
| `pericia`         | Requer disciplina especial (como “Empatia”, “Rastreamento”) |

---

### 🎭 **3. Emocionais / Dramáticas**

| Tag             | Uso                                                 |
| --------------- | --------------------------------------------------- |
| `decisao_moral` | Dilema ético ou emocional; entrada interpretativa   |
| `urgencia`      | Cena exige ação rápida ou sob pressão               |
| `climax`        | Ponto alto da jornada (narrativo ou emocional)      |
| `confronto`     | Pode ser verbal, psicológico ou social              |
| `final`         | Encerramento; desfecho positivo, neutro ou negativo |

---

### 🪙 **4. Sistema / Meta-jogo**

| Tag          | Uso                                           |
| ------------ | --------------------------------------------- |
| `checkpoint` | Salvar progresso; ponto de ramificação        |
| `loot`       | Itens ganhos após ação, vitória ou exploração |
| `falha`      | Cena de derrota parcial (sem game over)       |
| `game_over`  | Morte, fracasso total, fim abrupto            |

---

Você **explica dentro do prompt** o que cada tag representa, e pede à IA para adaptar seu comportamento com base nisso.

#### 🧱 Exemplo de prompt:

```plaintext
Você é o narrador principal de um livro-jogo interativo. Baseado na descrição da cena, nas tags fornecidas e na decisão do jogador, você deve:

1. Continuar a narrativa de forma coerente.
2. Escolher o tipo de entrada mais apropriado para o jogador na próxima interação.
3. Atualizar o estado emocional e ambiental.
4. Considerar as tags como instruções de contexto.

TAGS E SEUS SIGNIFICADOS:

- `combate`: uma luta pode ocorrer. Reaja com tensão, perigo e ação. Ofereça entrada combinada.
- `encontro_npc`: o jogador encontra um personagem. Responda com diálogo. Ofereça entrada interpretativa ou múltipla.
- `decisao_moral`: há um dilema ético. Foque em emoções e consequências. Use entrada interpretativa.
- `exploracao`: o jogador pode investigar algo. Dê detalhes visuais e sons. Entrada combinada ou com perícia.
- `descoberta`: algo novo foi revelado. Narre com surpresa ou mistério. Entrada leve.
- `urgencia`: há pressão de tempo. Cena curta, reativa, com entrada simples.

Exemplo de entrada:

{
  "scene_description": "Você encontra um goblin ferido pedindo ajuda. Ele tem sangue nas mãos. Pode ser uma armadilha.",
  "tags": ["encontro_npc", "decisao_moral"],
  "player_input": "Tento conversar com ele, mas me mantenho a distância.",
  "player_status": {
    "vida": 12,
    "itens": ["espada", "poção de cura"],
    "emoção": "cauteloso"
  }
}
```

Você pode ter uma função no backend que **verifica as tags** e **orienta o prompt ou a IA com instruções complementares**.

#### Exemplo:

```ts
function gerarInstrucoesPorTag(tags: string[]): string {
  let instrucoes: string[] = [];

  if (tags.includes('combate')) {
    instrucoes.push("Prepare o jogador para uma situação de combate. Use linguagem tensa e imediata.");
  }
  if (tags.includes('decisao_moral')) {
    instrucoes.push("Apresente um dilema moral com possíveis consequências profundas. Permita decisão interpretativa.");
  }
  if (tags.includes('exploracao')) {
    instrucoes.push("Descreva o ambiente com riqueza de detalhes. Ofereça pistas e itens interagíveis.");
  }
  if (tags.includes('encontro_npc')) {
    instrucoes.push("Crie diálogo envolvente com personagem. Entrada deve ser interpretativa.");
  }

  return instrucoes.join(' ');
}
```




```json
{
  "next_scene_text": "Você abriu a porta com sucesso, mas ao fazê-lo, sua chave antiga quebrou. No entanto, você encontrou uma adaga escondida atrás da porta.",
  "scene_update": {
    "player_status_update": {
      "vida": 16,
      "emocao": "frustrado",
      "inventario": ["poção de cura", "adaga"],
      "disciplinas": ["Empatia", "Rastreamento"]
    },
    "flags": ["porta_aberta"]
  },
  "recommended_input_type": {
    "type": "binaria",
    "reason": "Agora o jogador deve decidir se investiga o corredor ou descansa."
  }
}
```


