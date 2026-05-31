# Plano de Ação: Modo Supervisão (Impersonation)

Este plano descreve como implementar a funcionalidade que permite aos Administradores assumirem temporariamente a perspectiva de um jogador padrão, ideal para suporte e depuração.

## 1. Evolução da API (Backend)
Atualmente, as rotas de jornada (`/api/journey`) filtram estritamente pelo ID da sessão logada. Vamos criar uma "Chave Mestra" para administradores.
- **`GET /api/journey`**: Aceitará um parâmetro de query opcional `?userId=...`. Se o usuário for ADMIN e o parâmetro existir, a API retornará as jornadas desse `userId`.
- **`POST /api/journey` e Métodos por `[id]`**: Mesmo tratamento. Se o `gameStore` indicar que está no "Modo Supervisão", ele enviará esse ID e a API autorizará a ação se o chamador for ADMIN.

## 2. Gerenciamento de Estado (Zustand)
Precisamos ensinar o cliente a operar em nome de outra pessoa sem perder a sessão original de Admin.
- Adicionar `impersonatedPlayerId` (string | null) no `gameStore`.
- Adicionar `impersonatedPlayerName` (string | null) para feedback visual.
- Criar funções `startImpersonation(id, name)` e `stopImpersonation()`.
- Atualizar a função `fetchJourneys` do Menu Principal para enviar o `?userId=` se houver alguém sendo impersonificado.

## 3. Painel Administrativo (UI)
- Adicionar um novo botão na lista de jogadores do `AdminDashboard`: **"Supervisionar Lendas"** (Ícone de Olho ou Máscara).
- Ao clicar, o sistema aciona `startImpersonation`, redireciona para a home (`/`) e recarrega as jornadas como se fosse aquele jogador.

## 4. Segurança Visual e Saída (UI)
É perigoso um admin esquecer que está impersonificando alguém e fazer ações indesejadas.
- **Banner Persistente:** Se `impersonatedPlayerId` for verdadeiro, exibir uma barra destacada no topo da tela (Menu e Jogo): `"⚠️ MODO SUPERVISÃO: Visualizando como [Nome]. [Sair]"`
- O botão `[Sair]` limpará o estado de supervisão e recarregará os dados originais do Admin.

---
**Vantagem deste Plano:** Ele não "quebra" a sessão do NextAuth. O admin continua logado como Admin (mantendo a segurança e o acesso ao dashboard), mas o aplicativo consome os dados do usuário alvo de forma transparente e temporária.
