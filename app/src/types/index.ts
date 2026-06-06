export interface PlayerStatus {
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  combatPower: number;
  moral: number; // For "Butterfly Effect"
  alignment?: string; // e.g., "Lawful Good", "Chaotic Evil"
  skills: Skill[];
  reputations: Record<string, number>; // New: Granular Karma
  insightPoints: number; // Cargas para questionar o mestre
  deathCount: number; // New: Track revivals for punishment systems
}

export interface AIPreferences {
  textModel: string;
  imageModel: string;
  ttsVoice: string;
}

export interface PlayerProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  apiKeys?: Record<string, string>;
  aiPreferences?: AIPreferences;
  mfaEnabled: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  icon?: string;
}

export interface JourneySettings {
  playerName: string;
  genre: 'fantasy' | 'cyberpunk' | 'sci-fi' | 'post-apocalyptic' | 'gothic-horror' | 'pirates' | 'western' | 'medieval-epic' | 'steampunk' | 'real-world';
  journeyLength: 'preview' | 'short' | 'medium' | 'long' | 'epic' | 'life-long';
  punishSystem: 'fail_tolerance_5' | 'fail_tolerance_3' | 'no_fail_tolerance' | 'permadeath';
  visualStyle: 'anime' | 'manga' | 'baroque' | 'pixel-art' | 'noir' | 'digital-art' | 'sketch' | 'dark-realism';
  narrativeStyle: 'suspense' | 'drama' | 'epic' | 'dark-humor' | 'romance' | 'tragedy' | 'fast-paced' | 'contemplative';
  tone: 'neutral' | 'dark' | 'hopeful' | 'gray' | 'heroic' | 'cynical';
  readStyle: 'essential' | 'fast' | 'moderate' | 'detailed' | 'literary';
  narrativeDetail: 'short' | 'medium' | 'long' | 'epic';
  enableImages?: boolean; // New: Toggle AI illustrations
  enableAudio?: boolean; // New: Toggle AI narration (TTS)
  autoPlayAudio?: boolean; // New: Toggle automatic audio playback
}

export interface Player {
  name: string;
  status: PlayerStatus;
  inventory: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  type: 'weapon' | 'armor' | 'consumable' | 'quest';
  durability?: number;
  maxDurability?: number;
}

export interface NarrativeScene {
  sceneId: string;
  narration: string;
  visualDescription: string;
  audioDescription?: string; // For "Soundscapes"
  audioVoice?: 'male' | 'female'; // New: Voice gender selection
  imageUrl?: string;
  audioUrl?: string; // For "Soundscapes"
  options: NarrativeOption[];
  tacticalOptions?: TacticalOptions; 
  puzzle?: {
    type: 'hangman' | 'anagram' | 'cipher' | 'riddle';
    solution: string;     // Resposta correta (ex: "ESPADAS")
    hint: string;         // Pista inicial (ex: "Forjada em aço")
    displayData: string;  // O que aparece inicialmente (ex: "_ _ _ _ _ _" ou "D S A S E P A")
    maxAttempts: number;  // Limite de erros antes da penalidade
  };
  selectedOption?: string; // The choice made by the player
  statusChanges?: Partial<PlayerStatus>;
  inventoryChanges?: {
    added: InventoryItem[];
    removed: string[];
  };
  skillChanges?: Skill[];
  worldUpdate?: {
    flags?: Record<string, any>;
    memories?: string[];
  };
  isGameOver: boolean;
  requiresRoll?: boolean; // New for dice roll mechanics
  suggestedSkills?: { id: string; name: string; spCost: number }[]; // New: Skills for roll boost
  lastRollOutcome?: {
    successLevel: 'critical_success' | 'success' | 'fail' | 'critical_fail';
    skillUsed?: string;
    bonusApplied?: number;
    finalValue: number;
    spConsumed?: number;
  };
  imageError?: boolean;
  imageLoading?: boolean; // New: track explicit image loading state
  audioError?: boolean; // New: Track audio generation failure
  audioLoading?: boolean; // New: track explicit audio loading state
  inquiries?: { question: string; answer: string; timestamp: number }[]; // New: Persist inquiries per scene
}

export interface TacticalOptions {
  actions: { 
    id: string; 
    label: string; 
    group: 'offensive' | 'defensive';
    requiresItem?: boolean; // New: If true, user MUST pick an item
    itemType?: 'weapon' | 'armor' | 'consumable' | 'quest'; // New: Hint for filtering
  }[];
  targets: { id: string; label: string; description?: string }[];
  availableItems?: string[]; // IDs from inventory
  availableSkills?: string[]; // IDs from skills
}

export interface GameNotification {
  id: string;
  type: 'item' | 'skill' | 'reputation' | 'moral' | 'memory' | 'status' | 'info';
  title: string;
  description?: string;
  timestamp: number;
  read: boolean;
}

export interface StatusLogEntry {
  id: string;
  type: 'hp' | 'sp';
  amount: number; // Positive for gain, negative for loss
  source: string; // "Monster name", "Item name", "Action name"
  timestamp: number;
  sceneId?: string;
}

export interface NarrativeOption {
  id: string;
  label: string;
  type: 'binary' | 'ternary' | 'quaternary' | 'composite' | 'interpretative' | 'combined' | 'puzzle';
}
