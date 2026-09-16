import { z } from 'zod';

export const sceneSchema = z.object({
  sceneId: z.string(),
  narration: z.string(),
  visualDescription: z.string(),
  audioDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  recommendedInputType: z.enum(['binary', 'multiple', 'combined', 'interpretative', 'puzzle', 'vision_requirement']),
  visionPrompt: z.string().optional(),
  options: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
  tacticalOptions: z.object({
    actions: z.array(z.object({
      id: z.string(),
      label: z.string(),
      group: z.enum(['offensive', 'defensive']),
      requiresItem: z.boolean().optional(),
      itemType: z.enum(['weapon', 'armor', 'consumable', 'quest']).optional()
    })),
    targets: z.array(z.object({ id: z.string(), label: z.string(), description: z.string().optional() })),
    availableItems: z.array(z.string()).optional(),
    availableSkills: z.array(z.string()).optional()
  }).optional(),
  puzzle: z.object({
    type: z.enum(['hangman', 'anagram', 'cipher', 'riddle']),
    solution: z.string(),
    hint: z.string(),
    displayData: z.string(),
    maxAttempts: z.number()
  }).optional(),
  statusChanges: z.object({
    hp: z.number().optional(),
    hpSource: z.string().optional(),
    sp: z.number().optional(),
    spSource: z.string().optional(),
    combatPower: z.number().optional(),
    moral: z.number().optional(),
    reputations: z.record(z.string(), z.number()).optional() ,
    blessings: z.array(z.any()).optional(),
    curses: z.array(z.any()).optional()
  }).optional(),
  inventoryChanges: z.object({
    added: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      quantity: z.number(),
      type: z.enum(['weapon', 'armor', 'consumable', 'quest', 'companion']) , isSpectral: z.boolean().optional()
    })).optional(),
    removed: z.array(z.string()).optional()
  }).optional(),
  worldUpdate: z.object({
    flags: z.record(z.string(), z.any()).optional(),
    memories: z.array(z.string()).optional()
  }).optional(),
  audioTheme: z.object({
    mood: z.enum(['exploration', 'combat', 'mystery', 'melancholic', 'victory']).optional(),
    ambientEffects: z.array(z.string()).optional()
  }).optional(),
  isGameOver: z.boolean(),
  requiresRoll: z.boolean().optional(),
});
