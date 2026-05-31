# Fantasy Portal - Project Overview

Fantasy Portal is an AI-driven interactive book-game (livro-jogo) system inspired by the Lone Wolf series. It extends traditional gamebook dynamics with complex AI interactions, dynamic scene generation, and advanced RPG mechanics.

## Core Concepts

- **Interactive Book-Game Evolution:** Beyond binary choices, it incorporates ternary/quaternary options, combined tactical actions (Action + Target + Item + Approach), and interpretive responses (free-form text/roleplay).
- **AI Integration:** Uses Gemini/GPT-4 to generate immersive narratives, update player statuses, manage inventory, and handle procedural scene illustrations.
- **Narrative Complexity:** Features various journey lengths (Short to Epic/LifeLong), multiple genres (Fantasy, Cyberpunk, etc.), visual styles (Anime, Pixel Art, etc.), and narrative tones (Epic, Suspense, etc.).

## Key Systems & Mechanics

### Player Status (`player_status`)
- **HP (Health Points):** 0-20. Permanent injury system triggers if damage ≥ 50% HP.
- **SP (Stamina Points):** 0-15. Fatigue affects performance in successive battles.
- **Combat Power:** 0-30. Capacity against different monster types.
- **Skills:** Special abilities like Tracking, Healing, Empathy, etc.
- **Inventory:** Automated bag management.

### Interaction Types (`interaction_types`)
- **Binary/Ternary/Quaternary:** Fixed choice paths.
- **Composite (Combinada):** Action + Target + Item + Approach. Rule: Max 2 actions (1 Offensive/Defensive + 1 Item/Skill).
- **Interpretative:** Free-form player input for moral dilemmas or complex dialogues.

### Punishment & Permadeath (`punish_system`)
- **Modes:** `fail_tolerance_5`, `fail_tolerance_3`, `no_fail_tolerance`, `permadeath`.
- **Permadeath:** Critical failure or reaching failure limit in this mode leads to permanent game over (`fim_de_jogo: true`), blocking session reentry.

### Narrative Styles (`readstyle`)
- **Essential:** Minimal script-like text.
- **Fast:** Fluid and clear, minimal description.
- **Moderate:** Balanced action/description/dialogue.
- **Detailed:** Rich atmosphere and setting.
- **Literary:** High-depth, philosophical, and stylistically complex.

## Directory Structure & Important Files

- `/Prompts`: Contains the core logic for AI interaction.
    - `Prompt Inicial.md`: The system prompt defining the AI's role as narrator and game master.
    - `JSON SET.md`: Detailed JSON schemas for scene state and AI responses.
- `Principais recursos.md`: Overview of the system's main features and enums.
- `Permadeath.md`: Logic and implementation details for the punishment and death systems.
- `Tags.md`: Definitions for scene tags (e.g., `combate`, `evento`, `decisao_moral`) used to guide AI behavior.
- `Nomeclaturas.md`: Standardization of terms in English for code/API compatibility.

## Usage & Development Guidelines

- **Standardization:** Always use English for property names, enums, and data structures (e.g., `hp`, `sp`, `inventory`, `sceneId`) as per `Nomeclaturas.md`.
- **JSON Communication:** All AI interactions must adhere to the structured JSON format defined in the prompts.
- **Scene Tags:** Use specific tags to instruct the AI on the context of the scene (e.g., use `urgency` for fast-paced action).
- **Validation:** Ensure AI responses include required fields like `scene_id`, `narration`, `player_status`, `visual_description`, and `fim_de_jogo`.

## TODO / Future Enhancements
- Implement the "Step" system to limit journey size.
- Refine the luck/dice system for digital combat.
- Finalize the PDF generation system for journey summaries.
