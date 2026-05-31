# Plano: Implementação de Armazenamento de Mídia com MinIO

Este plano descreve a integração do MinIO como provedor de armazenamento de blobs para o sistema Fantasy Portal, permitindo a persistência de imagens geradas por IA e preparando a infraestrutura para futuros uploads de jogadores.

## 1. Infraestrutura (Docker)

Adicionar o serviço MinIO ao `app/docker-compose.yml` para fornecer o armazenamento compatível com S3 localmente.

### Alterações:
- Inclusão do container `minio/minio`.
- Configuração de volumes persistentes em `./database/minio`.
- Exposição das portas 9000 (API) e 9001 (Console).
- Criação automática do bucket `fantasy-portal-assets`.

## 2. Configuração de Ambiente (.env)

Adicionar as credenciais necessárias para a comunicação entre a aplicação Next.js e o MinIO.

```env
# MinIO / S3 Configuration
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="fantasy-portal-assets"
MINIO_USE_SSL="false"
# URL pública para acesso às imagens (pode ser diferente via proxy)
NEXT_PUBLIC_ASSETS_URL="http://localhost:9000/fantasy-portal-assets"
```

## 3. Modelo de Dados (Prisma)

Atualizar o `schema.prisma` para rastrear as mídias geradas e associá-las às jornadas.

### Novo Modelo: `Asset`
- `id`: Identificador único.
- `journeyId`: Relacionamento com a Jornada.
- `url`: Caminho completo ou chave do objeto no MinIO.
- `type`: Tipo do asset (`AI_GENERATED`, `PLAYER_UPLOAD`).
- `metadata`: JSON com prompt utilizado, dimensões, etc.
- `createdAt`: Timestamp.

## 4. Camada de Aplicação

### Dependências
- Instalar `@aws-sdk/client-s3`.

### Implementação de Lib
- Criar `app/src/lib/storage.ts`: Singleton para o cliente S3 e funções auxiliares `uploadBuffer(buffer, key, contentType)`.

### Atualização da API de Imagem
- Modificar `app/src/app/api/image/route.ts`:
  1. Gerar imagem via IA.
  2. Gerar uma chave única (ex: `journeys/{id}/{timestamp}.png`).
  3. Upload do buffer para o MinIO.
  4. Registrar no banco de dados via Prisma.
  5. Retornar JSON com `url` e `assetId`.

## 5. Fluxo de Execução

1. **Infra**: Atualizar `docker-compose.yml` e subir containers.
2. **Env**: Configurar `.env`.
3. **Database**: Atualizar schema e rodar `npx prisma migrate dev`.
4. **Code**: Instalar SDK e implementar `storage.ts`.
5. **Code**: Refatorar `api/image/route.ts`.
6. **Validação**: Testar geração de imagem e verificar persistência no MinIO e Postgres.
