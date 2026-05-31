export interface PlayerStatus {
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  combatPower: number;
  moral: number; // For "Butterfly Effect"
  alignment?: string; // e.g., "Lawful Good", "Chaotic Evil"
  skills: Skill[];
  reputations?: Record<string, number>; // New: Granular Karma
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
  enableImages?: boolean; // New: Toggle AI illustrations
  enableAudio?: boolean; // New: Toggle AI narration (TTS)
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
  imageUrl?: string;
  audioUrl?: string; // For "Soundscapes"
  options: NarrativeOption[];
  tacticalOptions?: TacticalOptions; 
  tacticalMap?: TacticalMap; // New for "Grid-based Combat"
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
  imageError?: boolean;
}

export interface TacticalMap {
  gridSize: { rows: number; cols: number };
  entities: TacticalEntity[];
  environment?: {
    id: string;
    type: 'wall' | 'fire' | 'water' | 'obstacle';
    position: Position;
  }[];
}

export interface TacticalEntity {
  id: string;
  name: string;
  type: 'player' | 'enemy' | 'npc';
  position: Position;
  hp?: number;
  maxHp?: number;
  spriteUrl?: string; // AI generated sprite
}

export interface Position {
  x: number;
  y: number;
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
