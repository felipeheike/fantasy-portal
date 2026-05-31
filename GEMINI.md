# 🌌 Fantasy Portal - Manual do Agente (GEMINI.md)

Este documento é a fonte da verdade para o agente de desenvolvimento. Ele define a arquitetura, padrões e mecânicas do Fantasy Portal.

## 🏗️ Estrutura de Diretórios (Domínios)

O projeto é organizado estrategicamente para separar regras de negócio, inteligência e infraestrutura:

- `🧠 core/`: Fundamentos da IA, padrões de dados e modelos de interação.
- `🛡️ rules/`: Mecânicas de jogo, regras de sobrevivência e definições de tags.
- `📋 lifecycle/`: Planos de inovação e relatórios de execução.
- `🛠️ tools/`: Scripts de depuração, testes e utilitários de sistema.
- `🚀 app/`: Aplicação Next.js, APIs e Banco de Dados (Prisma).

## 🧠 Padrões de Inteligência Artificial

### Contrato de Dados (JSON)
Todas as respostas do Narrador (IA) devem seguir o schema definido em `app/src/app/api/chat/route.ts`. Nomes de propriedades devem ser estritamente em **Inglês** e CamelCase.

### Diversificação de Interações
O sistema exige variedade narrativa. O parâmetro `.env` (`MAX_REPETITIVE_INTERACTIONS`) dita o limite de repetição de modos de entrada (Binary, Multiple, Combined, Interpretative). O modo **Combined** deve ser priorizado em cenas de conflito ou exploração técnica.

## ⚔️ Mecânicas Vitais

### Reputação Granular (Butterfly Effect)
A alma do herói é dividida entre:
1. **Karma Global:** Média moral do jogador.
2. **Reputações Locais:** Record de influências individuais (NPCs, Facções, Cidades).
*Instrução:* A IA deve sempre batizar a entidade afetada em `statusChanges.reputations`.

### Diário de Batalha e Vigor (Status Log)
Todas as variações de HP (Vitalidade) e SP (Estamina) devem ter uma **fonte declarada** (`hpSource`, `spSource`). O sistema persiste esses logs para visualização no frontend.

### Persistência e Sincronização
- **Banco de Dados:** PostgreSQL (Prisma) para dados estruturados.
- **Blob Storage:** MinIO (S3 Local) para Assets (Imagens e Áudio).
- **Notificações:** Feedback em tempo real via Toasts (Sonner) para ganhos de itens, habilidades e marcos morais.

## 🛠️ Diretrizes de Desenvolvimento

1. **Localização:** Backend/Código em Inglês. Narrativa/Frontend em PT-BR.
2. **Segurança:** Nunca comitar chaves de API. Utilizar sempre o `.gitignore` configurado.
3. **Persistência Local:** Ao realizar mudanças profundas no `gameStore`, instruir o usuário a utilizar o botão "Limpar Memória do Navegador" no Menu Principal.

---
*Este manual deve ser atualizado a cada novo incremento de arquitetura.*
