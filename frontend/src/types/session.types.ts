// Game Session Types

export interface GameSession {
  _id: string;
  campaignId: string;
  sessionNumber: number;
  sessionDate: Date;
  startTime: Date;
  endTime?: Date;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  
  masterUserId: string;
  playerCharacterIds: string[];
  
  currentCombatId?: string;
  inGameDate?: string;
  location?: string;
  
  notes?: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameEvent {
  _id: string;
  sessionId: string;
  campaignId: string;
  timestamp: Date;
  eventType: EventType;
  actorId: string;
  actorType: 'character' | 'npc' | 'master';
  targetId?: string;
  targetType?: 'character' | 'npc';
  data: Record<string, any>;
  visible: boolean;
  createdAt: Date;
}

export type EventType =
  | 'damage'
  | 'healing'
  | 'short_rest'
  | 'long_rest'
  | 'dice_roll'
  | 'spell_cast'
  | 'spell_slot_used'
  | 'feature_used'
  | 'condition_added'
  | 'condition_removed'
  | 'initiative_rolled'
  | 'combat_started'
  | 'combat_ended'
  | 'turn_started'
  | 'turn_ended'
  | 'death_save'
  | 'level_up'
  | 'item_used'
  | 'message';

export interface CombatEncounter {
  _id: string;
  sessionId: string;
  campaignId: string;
  status: 'preparing' | 'active' | 'completed';
  currentRound: number;
  currentTurn: number;
  participants: CombatParticipant[];
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CombatParticipant {
  id: string;
  characterId?: string;
  npcId?: string;
  name: string;
  type: 'character' | 'npc' | 'monster';
  initiative: number;
  maxHp: number;
  currentHp: number;
  temporaryHp: number;
  armorClass: number;
  conditions: string[];
  hidden: boolean;
  defeated: boolean;
}

export interface DiceRoll {
  id: string;
  sessionId: string;
  userId: string;
  characterId?: string;
  rollType: 'ability' | 'skill' | 'attack' | 'damage' | 'saving_throw' | 'custom';
  formula: string;
  result: number;
  rolls: number[];
  modifier: number;
  advantage?: boolean;
  disadvantage?: boolean;
  secret: boolean;
  timestamp: Date;
}

export interface Message {
  _id: string;
  sessionId?: string;
  campaignId: string;
  senderId: string;
  senderName: string;
  recipientId?: string;
  recipientType?: 'user' | 'group';
  content: string;
  messageType: 'text' | 'roll' | 'system';
  isPrivate: boolean;
  timestamp: Date;
  read: boolean;
}

// Made with Bob
