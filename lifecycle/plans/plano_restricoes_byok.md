# ⚔️ Plano de Ação: Restrições de Reino e Incentivo BYOK

Este plano detalha a implementação de limitações para usuários que utilizam as chaves de API padrão do sistema (Cota do Reino), incentivando a transição para chaves pessoais (BYOK).

## 🎯 Objetivos
*   **Controle de Custos:** Limitar o uso intensivo de recursos do servidor por usuários gratuitos.
*   **Tiering de Experiência:** Criar uma distinção clara entre "Aventureiros do Reino" e "Guardiões Ancestrais" (BYOK).
*   **Transparência de Limites:** Informar o usuário sobre sua cota atual de forma imersiva.

---

## 🏗️ Implementação Técnica

### 1. Backend: Validação de Limites (`api/journey/route.ts`)
Modificar a criação de jornadas para:
*   Contar quantas jornadas ativas o usuário possui.
*   Verificar se o usuário possui chaves de API habilitadas.
*   **Regra:** Se NÃO houver chaves pessoais, bloquear a criação da 4ª jornada.

### 2. Frontend: Oráculo de Restrições (`JourneySetup.tsx`)
Implementar lógica condicional nos passos de cadastro:

*   **Poder de Sincronização (Global):**
    *   Exibir um badge dinâmico no topo: 
        *   `📜 Canalização do Reino` (Sem chaves pessoais)
        *   `✨ Poder Ancestral` (Com chaves pessoais)

*   **Passo 2 (O Destino da Jornada):**
    *   Se sem chaves: Apenas `Preview` (10 cenas) habilitado.
    *   Outras opções ficam desativadas com a mensagem: "Exige Canalização Pessoal".

*   **Passo 6 (Magnitude Narrativa):**
    *   Se sem chaves: Bloquear `Longo` e `Épico`.
    *   Opções permitidas: `Curto` e `Médio`.

---

## 🎨 Design e UX Writing

### Badge de Status (Steps)
Localizado ao lado do indicador de passos:
*   **Texto:** `Vínculo: Cota do Reino`
*   **Estilo:** Cinza/Zinco com borda sutil. Tooltip explicativo: "Você está usando a energia do portal. Para jornadas mais longas, vincule sua própria fonte de poder no perfil."

### Bloqueio Amigável
Em vez de apenas desabilitar os botões, usaremos um estado de "Locked":
*   Ícone de cadeado sutil.
*   Ao clicar: "Este nível de imersão exige que você traga sua própria chave de API (Gemini/OpenAI)."

---

## 🚀 Fases de Execução

### Fase 1: Inteligência de Perfil no Setup
1.  Atualizar o `JourneySetup.tsx` para buscar o status das chaves do usuário ao iniciar.
2.  Implementar o sistema de "Tiers" no estado local do formulário.

### Fase 2: Bloqueios Visuais
1.  Aplicar restrições no Passo 2 e Passo 6.
2.  Adicionar o Badge de Status no cabeçalho do Modal de Setup.

### Fase 3: Validação de Servidor
1.  Implementar a trava de no máximo 3 jornadas para usuários sem BYOK no endpoint `POST /api/journey`.

---
**Status:** Aguardando Aprovação para iniciar Fase 1.
**Localização do Arquivo:** `lifecycle/plans/plano_restricoes_byok.md`
