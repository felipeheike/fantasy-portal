# 🗺️ Plano de Ação: Escalabilidade e Normalização do Histórico (CONCLUÍDO)

Este plano detalhou a transição bem-sucedida da arquitetura de "JSON Blob" para um modelo normalizado "Append-Only".

## ✅ Implementações Realizadas

1.  **🛡️ Integridade de Dados:**
    *   Criada a tabela `Scene` vinculada a `Journey`.
    *   Mantida a coluna `history` (JSON) como backup e para compatibilidade (Dual-Write).
    *   Executado script de migração `migrate_json_to_scenes.ts` com sucesso em ambiente DEV.

2.  **🔌 API Escalável:**
    *   `POST /api/journey/[id]/scenes`: Salva apenas a última cena, economizando banda.
    *   `GET /api/journey/[id]/scenes`: Suporta paginação para carregamento sob demanda.

3.  **🧠 Store & Sync:**
    *   `gameStore` refatorado para suportar `fetchMoreScenes`.
    *   `page.tsx` atualizado para realizar sincronização incremental automática.

4.  **🎨 Experiência do Usuário (UI):**
    *   **Scroll Reverso:** Implementado com `IntersectionObserver` e elemento sentinela no `NarrativePanel`.
    *   **Ancoragem de Scroll:** Utilizado `overflow-anchor: auto` para evitar que a tela pule ao carregar cenas antigas.
    *   **Capítulos Reais:** A numeração dos capítulos agora utiliza a ordem persistida no banco de dados (`order`).

---
**Status:** 🏁 Concluído.
**Data:** 05/06/2026
**Localização do Script de Migração:** `app/prisma/migrate_json_to_scenes.ts` (Pode ser usado em PRD antes da limpeza).
