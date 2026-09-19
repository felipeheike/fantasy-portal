# ✨ Recursos Principais do Fantasy Portal

O **Fantasy Portal** não é apenas um chat de IA; é um ecossistema completo de RPG que evolui o conceito de livros-jogo tradicionais através de tecnologia multimodal e tática.

## 🧠 Narrador Soberano (IA Generativa)
Utiliza modelos de linguagem de ponta (**Google Gemini 1.5 Pro/Flash**) para gerar narrativas densas, poéticas e contextuais. O mestre não apenas conta a história, mas gerencia:
*   **Estatísticas Dinâmicas:** HP, SP (Estamina) e Poder de Combate.
*   **Consequências Morais:** Sistema de Karma Global e Reputações Locais com NPCs e facções.
*   **Inventário Reativo:** Itens encontrados são persistidos e influenciam as opções disponíveis.

## 🎲 Sistema de Sorte e Habilidades (Luck Actions)
Diferente dos sistemas fixos, aqui a sorte é estratégica:
*   **Dados D10:** Rolagens críticas que decidem o sucesso ou falha de ações arriscadas.
*   **Grimório de Habilidades:** O jogador pode canalizar habilidades aprendidas para aplicar bônus às rolagens.
*   **Gestão de Estamina:** Usar habilidades consome SP, exigindo que o jogador decida quando vale a pena arriscar seu fôlego por um resultado melhor.

## 👁️ Olho do Mestre (AI Vision)
A funcionalidade mais inovadora do sistema:
*   **Escaneamento de Objetos:** Através da câmera, o jogador pode enviar fotos de objetos do mundo real.
*   **Transmutação Narrativa:** A IA identifica o objeto (ex: uma caneca, uma chave, um relógio) e o integra instantaneamente à história como um item lendário com atributos únicos.

## 🎧 Paisagens Sonoras e Voz (TTS)
*   **Narração Imersiva:** Integração com OpenAI TTS e Gemini Audio para vozes naturais e atmosféricas.
*   **Ambientação:** Descrições sonoras que mudam conforme o clima e a tensão da cena.

## ⚔️ Orquestração Tática e Enigmas
*   **Combate Dinâmico:** Interface que permite escolher alvos, armas e técnicas em confrontos gerados em tempo real.
*   **Desafios Mentais:** Puzzles de forca, anagramas e riddles (enigmas) que bloqueiam o caminho do herói, exigindo raciocínio real do jogador.

## 🎨 Theme Hub (Dual Palette)
*   **Personalização:** Um editor completo para criar paletas de cores customizadas.
*   **Modo Sol e Lua:** Suporte nativo a temas Light/Dark com cores vibrantes independentes, persistidos na nuvem vinculados ao perfil do usuário.
*   **Presets de Acessibilidade:** Alto Contraste, Leitura Fácil (fonte Atkinson Hyperlegible) e Contraste Seguro (paleta amigável para daltonismo), prontos pra ativar com um clique.
*   **Painel de Acessibilidade:** Reduzir Animações, Seguir Tema do Sistema e Tamanho da Fonte (P/M/G/GG), reunidos num único botão no Hub de Temas.
*   **Importar/Exportar Tema:** Copie o código de um tema (cores + fontes) e envie pra alguém colar e aplicar como ponto de partida do próprio tema.

## 👁️‍🗨️ Modo Espectador
*   **Link de Compartilhamento:** O dono da jornada gera um link com token de uso único — a primeira pessoa que abrir "resgata" o acesso, qualquer reabertura por outra pessoa é bloqueada.
*   **Acesso Somente-Leitura:** Quem assiste vê a narração e o status do herói em tempo real (sem poder agir), até o dono revogar o link a qualquer momento.

## 📜 Exportação de Lendas
*   **The Legend's Book:** Gere um PDF diagramado da sua aventura ao final da jornada.
*   **Modo Dual PDF:** Escolha entre uma versão "Art" (com ilustrações) ou "Text" (focada em leitura limpa) para preservar sua história.

## 📯 Avisos e Comunicação (Câmara do Mestre)
*   **Aviso Global (MOTD):** O admin publica uma mensagem vista por todo jogador ao abrir o app, com variantes info/aviso/crítico.
*   **Avisos Individuais:** Envie uma missiva direto para uma alma específica pela aba "Almas" do dashboard, com histórico consultável pelo próprio jogador em "Missivas".

## 🪄 Editor de Prompt do Narrador (sem deploy)
*   **Aba "Narrativa":** O admin ajusta a persona do narrador e o tom das 4 magnitudes de cena (curto/médio/longo/épico), além de diretrizes extras de tom — tudo aplicado na próxima cena gerada, sem precisar de um novo deploy.
*   **Contrato Protegido:** As regras ligadas ao formato JSON da cena (dado, puzzle, combate, mundo) continuam fixas em código, fora do alcance do editor.

## 📋 Auditoria Administrativa
*   **Aba "Auditoria":** Trilha das últimas ações do time de moderação — mudança de acesso, banimento, reset de senha, supervisão, avisos e edições do prompt narrativo — com quem fez, quando e em qual jogador.

## 📡 Radar de Sessões Ativas
*   **Aba "Ao Vivo":** Veja quem está jogando agora, em qual gênero e cena, com HP/SP e a última narração — um jeito leve de checar o pulso do portal antes de decidir supervisionar alguém.

## 🔧 Modo Manutenção
*   **Toggle na Câmara do Mestre:** O admin ativa uma tela de manutenção (com mensagem customizável) pra todo jogador não-admin, sem precisar reiniciar ou derrubar o app — o servidor continua rodando o tempo todo, só muda o que renderiza.
*   **Sempre Acessível:** Login e o painel admin continuam abertos durante a manutenção; o `/api/chat` também recusa gerar cena nova nesse período, evitando gasto de IA numa aba esquecida aberta. Links de espectador continuam funcionando normalmente.
