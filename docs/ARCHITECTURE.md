# 🏗️ Arquitetura do Sistema

O **Fantasy Portal** foi projetado para ser uma aplicação resiliente, rápida e capaz de lidar com estados complexos de IA multimodal.

## 🛰️ Visão Geral dos Componentes

### 1. Camada de Inteligência (Brain)
O sistema é "Model Agnostic", mas otimizado para a stack do Vercel AI SDK:
*   **Google Gemini 1.5:** Orquestrador principal de narrativa, visão computacional e decisões mecânicas.
*   **OpenAI DALL-E 3:** Motor de geração de ilustrações épicas para cada capítulo.
*   **OpenAI TTS / Gemini Audio:** Transformação de texto em voz atmosférica.

### 2. Fluxo de Dados (Real-time State)
*   **Zustand:** Gerencia o estado reativo do jogo (HP, inventário, histórico). Utiliza persistência local para evitar perda de dados em refresh do browser.
*   **Optimistic UI:** As ações do jogador refletem imediatamente na interface enquanto a IA processa o próximo capítulo.

### 3. Persistência e Cache
*   **PostgreSQL:** Armazenamento robusto de perfis, chaves BYOK e o histórico granular de cenas.
*   **MinIO (S3 API):** CDN privada para armazenar as centenas de imagens e áudios gerados durante uma jornada, garantindo que o PDF de exportação tenha acesso rápido a esses assets.

### 4. Orquestração e Deploy
*   **Docker:** Toda a stack (App, DB, MinIO, Proxy) é containerizada para garantir que o ambiente seja idêntico em dev e produção.
*   **Traefik (Reverse Proxy):** Gerencia o roteamento e certificados SSL no ambiente do servidor.

## 🛡️ Segurança (Identity Layer)
*   **NextAuth.js:** Autenticação via JWT.
*   **MFA (2FA):** Proteção via TOTP (Google Authenticator) para usuários com chaves de API cadastradas.
*   **AES Encryption:** Chaves de API do usuário são criptografadas no banco de dados e só descriptografadas em memória durante a chamada à IA.
