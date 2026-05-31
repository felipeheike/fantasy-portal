
-  Além das interações binárias que já existem em livros jogos ter a possibilidade de interpretar algumas cenas. Operações ternárias e quartenárias. Escolhas combinadas para combate.
- Uso de dados da sorte digital para combate, registro automático de vida durante a jornada
- Registro automático de itens na bag

| Tipo                       | Descrição                                                    | Quando usar                                                     |
| -------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| **Binária**                | Escolhas simples entre dois caminhos                         | Portas, ações diretas, decisões com impacto rápido              |
| **Ternária / Quartenária** | Múltiplas escolhas fixas, controladas                        | Caminhos ramificados ou escolha entre personagens, locais, etc. |
| **Combinada**              | Ação + alvo + item + abordagem (combate, interação)          | Combates, furtividade, ações táticas                            |
| **Interpretativa**         | Jogador escreve uma resposta livre ou fala como o personagem | Momentos emocionais, diálogos, decisões complexas ou morais     |
Oferecer elementos ao jogador para **montar sua ação**, por exemplo:

> **O que você faz?**
>
> * Ação: (Escolher) ⚔️ Atacar / 🛡️ Defender / 🤫 Esconder
> * Alvo: (Escolher) 🐺 Inimigo / 🚪 Porta / 🎯 Objeto
> * Item: (Opcional) 🗡️ Arma / 🧪 Poção / 🔮 Item mágico

A combinação gera uma entrada tipo:

> "Você tentou se esconder atrás da porta usando sua poção de invisibilidade."


- Sistema de steps para limitar o tamanho da jornada

| Label     | Valor interno           | Descrição                                     |
| --------- | ----------------------- | --------------------------------------------- |
| **Curta** | `"short"` (1–50)        | Uma jornada breve com finais rápidos.         |
| **Média** | `"medium"` (51–99)      | Tempo equilibrado para evolução e clímax.     |
| **Longa** | `"long"` (100–250)      | Uma narrativa robusta com muitos caminhos.    |
| **Épica** | `"epic"` (251–300+)     | Uma verdadeira saga com grandes ramificações. |
| LifeLong  | `"life-long"`(infinite) | Enquanto estiver vivo em sua jornada          |
| Preview   | `¨preview"` (1-10)      | Experimentar uma história                     |

- Sistema de punição

| Label                | Valor interno         | Efeito narrativo                          |
| -------------------- | --------------------- | ----------------------------------------- |
| **Tolerante**        | `"fail_tolerance_5"`  | Até 5 falhas graves são toleradas         |
| **Moderado**         | `"fail_tolerance_3"`  | Até 3 falhas antes de consequências       |
| **Rigoroso**         | `"no_fail_tolerance"` | Cada falha pode ter peso imediato         |
| **Morte permanente** | `"permadeath"`        | Uma falha crítica pode terminar a jornada |

- Sistema de geração de histórias baseadas em gêneros pré-formatados 

| Nome    | Exemplos sugeridos                                                                                                                                                    |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `genre` | `"fantasy"`, `"cyberpunk"`, `"ficção científica"`, `"pós-apocalipse"`, `"terror gótico"`, `"piratas"`, `"western"`, `"épico medieval"`, `"steampunk"`, `"mundo real"` |


- Sistema de geração de ilustração e estilo das imagens cada cena.

| Nome           | Exemplos sugeridos                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `visual_style` | `"anime"`, `"mangá"`, `"pintura barroca"`, `"pixel art"`, `"filme noir"`, `"arte digital moderna"`, `"sketch a lápis"`, `"realismo sombrio"` |

- Sistema de tom emocional e a forma como os eventos são narrados ao longo da jornada.

| Nome              | Exemplos sugeridos                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `narrative_style` | `"suspense"`, `"drama"`, `"épico"`, `"humor ácido"`, `"romance"`, `"tragédia"`, `"ação acelerada"`, `"contemplativo"` |

- Sistema de tom moral e filosófico e que pode levar a tendência ética do mundo gerado.

| Nome   | Exemplos sugeridos                                                              |
| ------ | ------------------------------------------------------------------------------- |
| `tone` | `"neutro"`, `"sombrio"`, `"esperançoso"`, `"cinzento"`, `"heroico"`, `"cínico"` |

- Sistema de nível de detalhamento da narrativa, influenciando o ritmo da história, o número de descrições e o foco textual.

| Nome        | Exemplos sugeridos                                                    |
| ----------- | --------------------------------------------------------------------- |
| `readstyle` | `"essencial"`, `"rápido"`, `"moderado"`, `"detalhado"`, `"literário"` |

- Sistema de idioma

| Nome       | Exemplos                          |
| ---------- | --------------------------------- |
| `language` | `"pt-BR"`, `"en"`, `"es"`, `"fr"` |

#### Significados sugeridos:

- **"essencial"**: texto mínimo necessário para seguir a história; quase como um roteiro.
    
- **"rápido"**: leitura leve com pouca descrição, mas com fluidez e clareza.
    
- **"moderado"**: equilíbrio entre ação, descrição e diálogo.
    
- **"detalhado"**: narrativa rica em ambientação, com mais texto por parágrafo.
    
- **"literário"**: uso de linguagem mais rebuscada, figuras de estilo, profundidade emocional e filosófica.
  

Exemplos de aplicação:

---

## 🧭 Situação:

Você está andando por uma trilha na floresta e se depara com uma bifurcação. Há um som estranho vindo da trilha da esquerda, enquanto a da direita parece segura, mas há marcas de sangue no chão.

---

### `readstyle: "essencial"`

> Você encontra uma bifurcação.  
> ⮕ **Esquerda**: barulho estranho.  
> ⮕ **Direita**: silenciosa, mas com sangue.  
> Vá para o parágrafo correspondente à sua escolha.

---

### `readstyle: "rápido"`

> A trilha se divide em duas. À esquerda, um som estranho ecoa entre as árvores. À direita, tudo parece calmo, mas há sangue fresco no solo.  
> Que caminho você escolhe?

---

### `readstyle: "moderado"`

> Após uma longa caminhada pela mata, você alcança uma bifurcação. O caminho à esquerda emite ruídos abafados — algo se move entre as sombras. O da direita parece tranquilo, mas o chão revela manchas de sangue recentes.  
> A tensão cresce: qual direção seguir?

---

### `readstyle: "detalhado"`

> A luz filtrada pelas copas das árvores dança sobre o solo irregular enquanto você avança pela trilha. Em dado momento, ela se divide em duas. À esquerda, ouve-se um som rouco e ritmado — talvez respiração, talvez maquinaria antiga. O caminho da direita está silencioso, mas marcas vermelhas serpenteiam pelo chão como rastros deixados às pressas.  
> Um pressentimento se forma: perigo espreita em ambos os lados.

---

### `readstyle: "literário"`

> A floresta respira em silêncio, como se aguardasse sua decisão. À sua frente, a trilha se desdobra em dois braços de destino. À esquerda, um som estranho, gutural, interrompe o sossego com uma inquietação quase viva — como se a própria mata sussurrasse advertências. À direita, reina uma calma enganosa, rasgada apenas pelas marcas escarlates que tingem o solo: o vestígio mudo de uma presença ausente, mas ainda recente.  
> O ar pesa. Cada escolha é um poema não escrito — e cada passo, uma sentença.

---



* Caminhos convergem para **vários finais possíveis**
* Cada jornada é única, mas termina em um ou mais **nós finais**
* Finais podem ser:

  * Vitória plena
  * Vitória parcial
  * Derrota
  * Final alternativo

--- 

1. **Criação**

   * Nome
   * 3 - 5 Disciplinas
   * 1 a 3 Armas
   * Vida 20/20
   * Stamina 15/15 (muitas batalhas seguidas pode ser prejudicial ao jogador)
   * Combate 30/30 (Capacidade do personagem perante aos tipos de monstros)

2. **Início**

   * Texto de introdução (gerado com IA ou fixo)
   * Escolha: seguir estrada / explorar caverna

3. **Caverna (IA responde com narrativa)**

   * Encontro com criatura (IA cria)
   * Sistema de combate simples

4. **Progresso**

   * Baseado em vitória/derrota, IA sugere novos caminhos
   * Pode haver eventos aleatórios ou tesouros

5. **Final**

   * Se jogador completar missão-chave → final A/B/C
   * Se morrer → final alternativo
   * Se falhar missão mas sobreviver → final D


**Sistema de Ferimentos Permanentes**:

- Se personagem sofrer golpe crítico (ex: dano ≥ metade do HP), pode rolar em uma tabela de consequências:
    
    - **Perda de olho** → -1 precisão
        
    - **Fratura grave** → redução de SP máxima
        
    - **Perda de braço** → não pode usar escudo
        
    - Pode haver **cura rara** ou **próteses mágicas**



### 💾 Armazenamento da imagem:

Para cada cena ilustrada:

```json
{
  "scene_id": 8,
  "image_url": "https://meu-jogo.ai/cenas/scene_008.jpg",
  "image_prompt": "A wounded goblin pointing at a map near a dying fire..."
}
```

Essa imagem será usada:

* No frontend (live)
* No PDF (final da jornada)