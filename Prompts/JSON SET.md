## Journey_set

```json
{
  "journey_set": {
    "name": "Atreus of war",
    "status_set": {
      "health_points": "15/15",
      "stamina_points": "20/20",
      "combat_power": "30/30"
    },
    "inventory": [
      "adaga",
      "espada de duas mãos"
    ],
    "emotions": [
      "curioso",
      "apreenssivo",
      "desconfiado"
    ],
    "skills_set": [
      "necromancia",
      "empatia com animais",
      "persuasão",
      "furtividade"
    ],
    "history_set": {
      "step_system": "epic",
      "punish_system": "fail_tolerance_3",
      "genre": "fantasy",
      "visual_style": "comics",
      "narrative_style": "neutral",
      "history_tone": "dark",
      "read_style": "detailed",
      "language": "pt-BR"
    }
  }
}
```

## Tags

```json

{
  "scene_tags": [
    {
      "tag": "introducao",
      "type": "estrutural",
      "description": "Primeiro bloco da jornada; configura mundo e personagem"
    },
    {
      "tag": "evento",
      "type": "estrutural",
      "description": "Algo acontece com ou sem escolha direta do jogador"
    },
    {
      "tag": "descoberta",
      "type": "estrutural",
      "description": "Revelação de algo importante: lore, mapa, segredo, item especial"
    },
    {
      "tag": "transicao",
      "type": "estrutural",
      "description": "Cena de deslocamento ou movimento entre áreas do mapa"
    },
    {
      "tag": "combate",
      "type": "mecanica",
      "description": "Ativa o sistema de combate. Exige entrada estratégica ou combinada"
    },
    {
      "tag": "encontro_npc",
      "type": "mecanica",
      "description": "Encontro com NPCs. Gatilho para diálogo, conflito ou aliança"
    },
    {
      "tag": "uso_item",
      "type": "mecanica",
      "description": "Cena exige ou sugere o uso de um item específico do inventário"
    },
    {
      "tag": "exploracao",
      "type": "mecanica",
      "description": "Cena interativa com o ambiente: armadilhas, pistas, salas ocultas, etc."
    },
    {
      "tag": "decisao_simples",
      "type": "mecanica",
      "description": "Escolhas binárias ou múltiplas com consequências moderadas"
    },
    {
      "tag": "pericia",
      "type": "mecanica",
      "description": "Requer o uso de uma disciplina especial (ex: Furtividade, Empatia)"
    },
    {
      "tag": "decisao_moral",
      "type": "emocional",
      "description": "Dilema ético ou emocional com impacto na moralidade ou narrativa"
    },
    {
      "tag": "urgencia",
      "type": "emocional",
      "description": "Cena de pressão ou limite de tempo; exige resposta rápida"
    },
    {
      "tag": "climax",
      "type": "emocional",
      "description": "Ponto de maior tensão ou emoção; ápice narrativo"
    },
    {
      "tag": "confronto",
      "type": "emocional",
      "description": "Conflito verbal, psicológico ou social entre personagens"
    },
    {
      "tag": "final",
      "type": "emocional",
      "description": "Encerramento da jornada. Pode ser positivo, trágico ou neutro"
    },
    {
      "tag": "checkpoint",
      "type": "sistema",
      "description": "Ponto de salvamento e ramificação narrativa"
    },
    {
      "tag": "loot",
      "type": "sistema",
      "description": "Ganho de itens ou recompensas após exploração ou combate"
    },
    {
      "tag": "falha",
      "type": "sistema",
      "description": "Cena de perda parcial; o jogo continua, mas com consequências"
    },
    {
      "tag": "game_over",
      "type": "sistema",
      "description": "Fim da jornada. Derrota definitiva ou morte narrativa"
    }
  ]
}

```



Para ler o JSON que você forneceu no Laravel, você pode utilizar a função `json_decode()` do PHP para transformar o conteúdo em um array ou objeto, dependendo de como você deseja acessar os dados. Vou te mostrar como fazer isso, além de uma maneira prática de integrar o JSON em um modelo do Laravel.

### Passos:

1. **Transformar o JSON em um array ou objeto em PHP**:
    
    Primeiramente, vamos decodificar o JSON para um array associativo ou um objeto.
    
    **Exemplo de Controller:**
    
    ```php
    <?php
    
    namespace App\Http\Controllers;
    
    use Illuminate\Http\Request;
    
    class PlayerController extends Controller
    {
        public function store(Request $request)
        {
            // Supondo que o JSON seja enviado via uma requisição POST
            $jsonData = $request->getContent();
            $data = json_decode($jsonData, true);  // true transforma em um array associativo
    
            // A partir daqui você pode acessar os dados
            $playerName = $data['player_set']['name'];
            $healthPoints = $data['player_set']['status_set']['health_points'];
            $inventory = $data['player_set']['inventory'];
            $skills = $data['player_set']['skills_set'];
    
            // Exemplo de resposta
            return response()->json([
                'player_name' => $playerName,
                'health_points' => $healthPoints,
                'inventory' => $inventory,
                'skills' => $skills
            ]);
        }
    }
    ```
    
2. **Modelar Dados no Laravel**:
    
    Uma boa prática no Laravel seria criar um **modelo** para representar as informações do jogador, e assim organizar melhor os dados e facilitar a manipulação. No seu caso, o JSON possui vários grupos de dados que poderiam ser modelados separadamente. Vamos criar uma estrutura básica de como você pode organizar esses dados no Laravel:
    
    - **Player Model** (`Player.php`):
        
        Criando um modelo para armazenar as informações principais do jogador.
        
        ```php
        <?php
        
        namespace App\Models;
        
        use Illuminate\Database\Eloquent\Factories\HasFactory;
        use Illuminate\Database\Eloquent\Model;
        
        class Player extends Model
        {
            use HasFactory;
        
            protected $fillable = [
                'name', 
                'emotion', 
                'inventory', 
                'skills_set', 
                'history_set', 
                'status_set'
            ];
        
            protected $casts = [
                'status_set' => 'array',  // Para armazenar status como um array
                'inventory' => 'array',
                'skills_set' => 'array',
                'history_set' => 'array',
            ];
        }
        ```
        
        - **Migration** (`create_players_table.php`):
            
            Você pode criar uma migração para gerar a tabela no banco de dados com campos apropriados. Aqui, usamos os campos do JSON e armazenamos as listas como `json`.
            
            ```php
            public function up()
            {
                Schema::create('players', function (Blueprint $table) {
                    $table->id();
                    $table->string('name');
                    $table->json('status_set');
                    $table->json('inventory');
                    $table->text('emotion');
                    $table->json('skills_set');
                    $table->json('history_set');
                    $table->timestamps();
                });
            }
            ```
            
3. **Recebendo o JSON na Requisição e Salvando no Banco**:
    
    Agora, no seu controller, você pode salvar os dados no banco de dados de forma simples utilizando o modelo `Player`.
    
    **Exemplo de Controller para salvar no banco**:
    
    ```php
    <?php
    
    namespace App\Http\Controllers;
    
    use App\Models\Player;
    use Illuminate\Http\Request;
    
    class PlayerController extends Controller
    {
        public function store(Request $request)
        {
            // Supondo que o JSON seja enviado via POST
            $jsonData = $request->getContent();
            $data = json_decode($jsonData, true);  // Decodifica em um array associativo
    
            // Criando um novo player com os dados do JSON
            $player = Player::create([
                'name' => $data['player_set']['name'],
                'emotion' => $data['player_set']['emotion'],
                'inventory' => $data['player_set']['inventory'],
                'skills_set' => $data['player_set']['skills_set'],
                'status_set' => $data['player_set']['status_set'],
                'history_set' => $data['player_set']['history_set'],
            ]);
    
            return response()->json([
                'message' => 'Player created successfully!',
                'player' => $player
            ]);
        }
    }
    ```
    

### Considerações:

- No modelo, usamos `protected $casts` para garantir que arrays e objetos sejam manipulados corretamente ao salvar ou recuperar os dados do banco.
    
- As tabelas podem armazenar os dados como JSON, o que facilita a manipulação de listas e objetos sem a necessidade de normalizar as tabelas em muitas colunas. Laravel cuida disso por trás dos panos.
    
- Não se esqueça de rodar as migrações após criar ou modificar as tabelas:
    
    ```bash
    php artisan migrate
    ```
    

### Testando:

Após configurar o controller, você pode testar fazendo uma requisição `POST` para a rota associada com o JSON que você forneceu.

Se precisar de mais alguma coisa ou tiver dúvidas, só avisar!