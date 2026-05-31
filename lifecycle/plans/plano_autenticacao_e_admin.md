# Plano de Ação: Autenticação e Painel Administrativo

Este plano define a estratégia para transformar o Fantasy Portal de um sistema de acesso livre para um ambiente seguro, com controle de contas e moderação de usuários.

## 1. Evolução do Banco de Dados (Prisma)
Para suportar o controle de acesso, o modelo `Player` precisará ser expandido. Para evitar confusão com o `status` do jogo (HP/SP), criaremos campos específicos para a conta.

**Alterações no `Player`:**
- `passwordHash`: String (para armazenamento seguro da senha).
- `role`: Enum `[ADMIN, PLAYER]` (Padrão: `PLAYER`).
- `accountStatus`: Enum `[PENDING, ACTIVE, INACTIVE]` (Padrão: `PENDING`).
- *Nota:* Um novo jogador que se cadastrará começará com status `PENDING` e não poderá jogar até que um administrador o altere para `ACTIVE`.

## 2. Camada de Segurança e Autenticação
Implementação de um sistema de sessões seguro.
- **Biblioteca Recomendada:** `NextAuth.js` (Auth.js) para Next.js 15, usando estratégia de JWT.
- **Middleware:** Um arquivo `middleware.ts` na raiz protegerá as rotas do jogo, garantindo que:
  - Usuários não logados sejam redirecionados para `/login`.
  - Usuários com status `PENDING` ou `INACTIVE` vejam uma tela de "Acesso Bloqueado/Aguardando Aprovação".
  - Usuários normais não acessem a rota `/admin`.

## 3. Interface de Autenticação (UI)
Criação de telas imersivas que sigam a estética do portal.
- **`/login`:** Tela de login clássica, com o logotipo da constelação ao fundo e campos estilizados de Email e Senha.
- **`/register`:** Tela para novos aventureiros solicitarem acesso, contendo Nome, Email e Senha.

## 4. O Painel do Administrador (Admin Dashboard)
Uma nova área exclusiva para moderação.
- **Rota:** `/admin/dashboard`.
- **Funcionalidades:**
  - Tabela ou Grid de Cartões listando todos os jogadores.
  - Indicadores visuais de Status (Amarelo para Pendente, Verde para Ativo, Vermelho para Inativo).
  - **Ações Imediatas:** Botões para "Aprovar Acesso" (muda de Pending para Active) e "Revogar Acesso" (muda de Active para Inactive).
- **Endpoint:** `/api/admin/players` (Protegido, acessível apenas por `role === 'ADMIN'`).

## 5. Roteiro de Execução

1. **Fase 1: Preparação de Dados:** Atualizar o `schema.prisma`, criar a migração e inserir um usuário "Master Admin" no seeder.
2. **Fase 2: Infraestrutura Auth:** Instalar dependências (`bcrypt` para senhas, `next-auth`), configurar credenciais e o `middleware.ts`.
3. **Fase 3: Telas de Acesso:** Construir os componentes de Login e Registro com validação.
4. **Fase 4: O Painel Admin:** Desenvolver a UI do Dashboard e a API para alteração de status.
5. **Fase 5: Conexão com o Jogo:** Garantir que o `gameStore` e a API de jornada peguem o ID do jogador logado a partir da sessão, eliminando o uso do `default-player-id`.

---
**Consideração Estratégica:** Essa mudança fará com que o jogo seja "Multi-usuário" de fato. Cada pessoa que logar terá acesso apenas às suas próprias lendas e inventários, o que torna a aplicação pronta para ser disponibilizada ao público.
