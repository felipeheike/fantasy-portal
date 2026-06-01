# Plano de Ação: Configuração para Modo de Produção

Este plano detalha a transição do ambiente de desenvolvimento contínuo (Turbopack) para um ambiente de produção otimizado dentro do Docker. Essa mudança resolverá definitivamente os erros de WebSocket (HMR) ao acessar a aplicação via Cloudflare Tunnel e aumentará consideravelmente a performance geral do sistema.

## 1. Adaptação do `docker-compose.yml`
Atualmente, o comando do container fixa a inicialização em modo de desenvolvimento: `command: sh -c "npm install && npm run dev"`.
Vamos alterar isso para permitir que scripts externos ou variáveis de ambiente ditem se a aplicação deve iniciar em modo dev ou produção.
- **Ação:** Remover o `command` estrito do docker-compose e passá-lo para a responsabilidade do Makefile, ou criar um script de entrada (`entrypoint.sh`). A forma mais elegante é permitir sobrescrita. Manteremos o dev como padrão no arquivo, mas criaremos comandos de produção.

## 2. Atualização do `Makefile`
Adicionaremos novos comandos rápidos para gerenciar o ambiente de produção com facilidade.
- `make prod`: Comando que fará o build da aplicação (`npm run build`) e, em seguida, iniciará o servidor otimizado do Next.js (`npm run start`) dentro do container.
- `make dev`: Retornará explicitamente a aplicação para o modo de desenvolvimento.

## 3. Otimizações Adicionais no Next.js
Para garantir que o build de produção no Docker funcione perfeitamente com os Tunnels e MinIO:
- O Next.js precisará compilar todos os componentes corretamente e mapear as variáveis de ambiente em tempo de build.
- A flag `NODE_ENV=production` será injetada dinamicamente pelo Makefile durante a inicialização em produção.

## 4. Roteiro de Execução
1. Atualizar o `Makefile` na pasta `app/` para incluir as diretivas `prod` e `dev`.
2. Executar o comando de build via Docker.
3. Reiniciar a aplicação em modo de produção para validar o fim do erro "WebSocket HMR" no console do navegador.

---
**Observação Estratégica:** Ao rodar em produção, alterações feitas no código fonte não aparecerão imediatamente no navegador (o "Fast Refresh" é desativado). Se você for desenvolver ou modificar os arquivos, precisará rodar `make dev` para retornar ao modo interativo.
