# 🌌 Fantasy Portal: Crônicas do Destino Infinito

**Fantasy Portal** é uma plataforma de RPG narrativo de próxima geração, alimentada por IA generativa e multimodal. Inspirado nos clássicos *gamebooks* (livros-jogo), o sistema expande a imersão tradicional através de inteligência artificial de ponta, permitindo jornadas infinitas e reativas a cada decisão do jogador.

## ✨ Recursos Principais

### 🧠 Narrador Soberano (IA Generativa)
Utiliza modelos **Gemini 1.5 Pro/Flash** para gerar narrativas densas, poéticas e contextuais. O mestre não apenas conta a história, mas gerencia estatísticas, inventário e consequências morais em tempo real.

### ⚔️ Combate Tático Visual
Diferente de RPGs puramente textuais, o Fantasy Portal introduz um **Grid de Batalha (5x5/8x8)** gerado dinamicamente. Visualize seu herói e inimigos em um mapa tático onde posicionamento e alcance importam.

### ⚖️ Sistema de Reputação Localizada
Suas ações moldam sua fama. O sistema rastreia seu **Karma Global** e sua influência individual com NPCs, Vilas e Facções. Seja um herói em uma cidade e um fora-da-lei em outra.

### 👁️ Olho do Mestre (Multimodalidade)
Traga o mundo real para o jogo. Através da câmera, envie fotos de objetos reais que o Gemini transformará em itens lendários dentro da sua lenda, com atributos e descrições automáticas.

### 🎧 Paisagens Sonoras Dinâmicas
Integração nativa com **Text-to-Speech (TTS)** para narração atmosférica de cada capítulo, aliada a descrições de áudio que definem o tom da cena.

### 📜 The Legend's Book (Exportação)
Ao fim da sua jornada, gere um **Livro de Arte em PDF** diagramado profissionalmente, contendo suas estatísticas finais, todos os textos da sua aventura e as ilustrações geradas pela IA.

## 🚀 Arquitetura Técnica

- **Frontend:** Next.js 15 (React 19) com Tailwind CSS e Framer Motion.
- **State Management:** Zustand (com persistência local).
- **Backend:** Next.js API Routes e Integração com Vercel AI SDK.
- **Banco de Dados:** PostgreSQL (Prisma ORM) para persistência de sessões.
- **Storage:** MinIO (S3 Local) para armazenamento de imagens geradas e narrações.
- **IA:** Google Gemini (Texto/Visão/Audio) e Imagen (Ilustrações).

## 🛠️ Configuração e Instalação

1. **Docker:** Certifique-se de ter o Docker instalado.
2. **Ambiente:** Configure o arquivo `app/.env` com suas chaves de API do Google Cloud.
3. **Execução:**
   ```bash
   make up   # Sobe os containers de App, Postgres, Redis e MinIO
   ```
4. **Acesso:** O portal estará disponível em `http://localhost:25035`.

---
*Este projeto é um experimento de fusão entre tecnologia e narrativa clássica.*
