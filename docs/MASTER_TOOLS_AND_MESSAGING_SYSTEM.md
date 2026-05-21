# Master Tools and Messaging System - Sistema Strumenti Master e Messaggistica

## Indice

1. [Panoramica](#1-panoramica)
2. [Master Combat Management](#2-master-combat-management)
3. [Sistema Messaggistica](#3-sistema-messaggistica)
4. [Master Dashboard](#4-master-dashboard)
5. [NPC Management](#5-npc-management)
6. [Encounter Builder](#6-encounter-builder)
7. [Session Notes](#7-session-notes)
8. [Database Schema](#8-database-schema)
9. [API Endpoints](#9-api-endpoints)
10. [Frontend Components](#10-frontend-components)

---

## 1. Panoramica

Il sistema fornisce strumenti dedicati al Dungeon Master per gestire combattimenti, comunicare con i giocatori, gestire NPC e costruire encounter. Include anche un sistema di messaggistica privata tra Master-Giocatori e tra Giocatori stessi.

### Funzionalità Principali

✅ **Master Combat Tools** - Gestione avanzata combattimenti con NPC
✅ **Private Messaging** - Chat private Master-Player e Player-Player
✅ **Group Chat** - Chat di gruppo per la campagna
✅ **Secret Rolls** - Tiri segreti visibili solo al Master
✅ **NPC Management** - Gestione completa NPC e mostri
✅ **Encounter Builder** - Costruttore encounter con CR calculator
✅ **Session Notes** - Note di sessione condivise o private
✅ **Initiative Tracker** - Tracker iniziativa avanzato per Master
✅ **HP Tracking** - Tracking HP multipli NPC
✅ **Condition Management** - Gestione condizioni per tutti i partecipanti

---

## 2. Master Combat Management

### 2.1 Master Combat Dashboard

```typescript
interface MasterCombatView {
  combatId: string;
  
  // Partecipanti
  participants: CombatParticipant[];
  
  // Controlli Master
  controls: {
    canAddParticipant: boolean;
    canRemoveParticipant: boolean;
    canEditHP: boolean;
    canEditInitiative: boolean;
    canApplyConditions: boolean;
    canMakeSecretRolls: boolean;
  };
  
  // NPC nascosti (visibili solo al Master)
  hiddenNPCs: CombatParticipant[];
  
  // Statistiche combattimento
  stats: {
    currentRound: number;
    totalDamageDealt: number;
    totalHealingDone: number;
    participantsDefeated: number;
  };
}
```

### 2.2 MasterCombatService

```typescript
class MasterCombatService {
  /**
   * Aggiungi NPC al combattimento (anche mid-combat)
   */
  async addNPCToCombat(
    combatId: string,
    npc: {
      name: string;
      type: 'npc' | 'monster';
      initiative: number;
      maxHp: number;
      currentHp: number;
      armorClass: number;
      hidden: boolean;  // Se true, visibile solo al Master
    },
    masterUserId: string
  ): Promise<CombatEncounter> {
    await this.verifyMasterPermission(combatId, masterUserId);
    
    const combat = await this.combatRepo.findById(combatId);
    
    const newParticipant: CombatParticipant = {
      id: uuidv4(),
      npcId: uuidv4(),
      name: npc.name,
      type: npc.type,
      initiative: npc.initiative,
      initiativeModifier: 0,
      isActive: false,
      isDefeated: false,
      conditions: [],
      currentHp: npc.currentHp,
      maxHp: npc.maxHp,
      temporaryHp: 0,
      armorClass: npc.armorClass,
      hidden: npc.hidden
    };
    
    // Inserisci in ordine di iniziativa
    const insertIndex = combat.participants.findIndex(
      p => p.initiative < npc.initiative
    );
    
    if (insertIndex === -1) {
      combat.participants.push(newParticipant);
    } else {
      combat.participants.splice(insertIndex, 0, newParticipant);
    }
    
    await this.combatRepo.save(combat);
    
    // Broadcast solo ai Master (se hidden) o a tutti
    if (npc.hidden) {
      await this.websocketService.broadcastToMasters(combat.sessionId, {
        type: 'NPC_ADDED_HIDDEN',
        participant: newParticipant
      });
    } else {
      await this.websocketService.broadcastToSession(combat.sessionId, {
        type: 'NPC_ADDED',
        participant: newParticipant
      });
    }
    
    return combat;
  }
  
  /**
   * Rimuovi partecipante dal combattimento
   */
  async removeParticipant(
    combatId: string,
    participantId: string,
    masterUserId: string
  ): Promise<void> {
    await this.verifyMasterPermission(combatId, masterUserId);
    
    const combat = await this.combatRepo.findById(combatId);
    
    const index = combat.participants.findIndex(p => p.id === participantId);
    if (index === -1) {
      throw new Error('Participant not found');
    }
    
    combat.participants.splice(index, 1);
    await this.combatRepo.save(combat);
    
    await this.websocketService.broadcastToSession(combat.sessionId, {
      type: 'PARTICIPANT_REMOVED',
      participantId
    });
  }
  
  /**
   * Modifica HP di un partecipante (Master only)
   */
  async setParticipantHP(
    combatId: string,
    participantId: string,
    newHp: number,
    masterUserId: string
  ): Promise<void> {
    await this.verifyMasterPermission(combatId, masterUserId);
    
    const combat = await this.combatRepo.findById(combatId);
    const participant = combat.participants.find(p => p.id === participantId);
    
    if (!participant) {
      throw new Error('Participant not found');
    }
    
    participant.currentHp = Math.max(0, Math.min(newHp, participant.maxHp));
    
    if (participant.currentHp === 0 && !participant.isDefeated) {
      participant.isDefeated = true;
    }
    
    await this.combatRepo.save(combat);
    
    await this.websocketService.broadcastToSession(combat.sessionId, {
      type: 'HP_UPDATED',
      participantId,
      newHp: participant.currentHp
    });
  }
  
  /**
   * Tiro segreto (visibile solo al Master)
   */
  async makeSecretRoll(
    combatId: string,
    rollType: 'attack' | 'save' | 'check',
    participantId: string,
    options: any,
    masterUserId: string
  ): Promise<GameEvent> {
    await this.verifyMasterPermission(combatId, masterUserId);
    
    const combat = await this.combatRepo.findById(combatId);
    const participant = combat.participants.find(p => p.id === participantId);
    
    if (!participant) {
      throw new Error('Participant not found');
    }
    
    // Esegui tiro
    const rollResult = await this.diceService.roll(rollType, options);
    
    // Crea evento marcato come "secret"
    const event = await this.eventRepo.create({
      sessionId: combat.sessionId,
      campaignId: combat.campaignId,
      eventType: `SECRET_${rollType.toUpperCase()}_ROLL` as GameEventType,
      actorId: participantId,
      actorType: 'npc',
      eventData: {
        ...options,
        secret: true
      },
      result: rollResult,
      timestamp: new Date(),
      canRollback: false,
      rolledBack: false
    });
    
    // Broadcast solo ai Master
    await this.websocketService.broadcastToMasters(combat.sessionId, {
      type: 'SECRET_ROLL',
      event
    });
    
    return event;
  }
  
  /**
   * Rivela tiro segreto ai giocatori
   */
  async revealSecretRoll(
    eventId: string,
    masterUserId: string
  ): Promise<void> {
    const event = await this.eventRepo.findById(eventId);
    
    await this.verifyMasterPermission(event.sessionId, masterUserId);
    
    // Broadcast a tutti
    await this.websocketService.broadcastToSession(event.sessionId, {
      type: 'SECRET_ROLL_REVEALED',
      event
    });
  }
  
  private async verifyMasterPermission(
    sessionId: string,
    userId: string
  ): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    
    if (session.masterUserId !== userId) {
      throw new Error('Only the Master can perform this action');
    }
  }
}
```

### 2.3 Bulk Operations

```typescript
class MasterBulkOperationsService {
  /**
   * Applica danno a multipli partecipanti (es. Fireball)
   */
  async applyAOEDamage(
    combatId: string,
    targetIds: string[],
    damage: number,
    damageType: string,
    source: string,
    allowSave: boolean,
    saveDC?: number,
    saveAbility?: string,
    masterUserId: string
  ): Promise<GameEvent[]> {
    await this.verifyMasterPermission(combatId, masterUserId);
    
    const events: GameEvent[] = [];
    
    for (const targetId of targetIds) {
      let actualDamage = damage;
      
      // Se permette saving throw
      if (allowSave && saveDC && saveAbility) {
        const saveResult = await this.diceService.rollSavingThrow(
          targetId,
          saveAbility,
          false,
          false,
          combatId,
          saveDC
        );
        
        if (saveResult.result.success) {
          actualDamage = Math.floor(damage / 2);
        }
      }
      
      const event = await this.damageService.applyDamage(
        targetId,
        actualDamage,
        damageType,
        source,
        combatId
      );
      
      events.push(event);
    }
    
    return events;
  }
  
  /**
   * Applica condizione a multipli partecipanti
   */
  async applyConditionToMultiple(
    combatId: string,
    targetIds: string[],
    conditionName: string,
    duration: number,
    masterUserId: string
  ): Promise<void> {
    await this.verifyMasterPermission(combatId, masterUserId);
    
    for (const targetId of targetIds) {
      await this.conditionService.applyCondition(
        targetId,
        conditionName,
        'Master',
        duration,
        undefined,
        undefined,
        combatId
      );
    }
  }
}
```

---

## 3. Sistema Messaggistica

### 3.1 Database Schema

```typescript
interface Message {
  id: string;
  campaignId: string;
  
  // Tipo messaggio
  type: 'private' | 'group' | 'system';
  
  // Mittente
  senderId: string;           // User ID
  senderName: string;
  senderRole: 'master' | 'player';
  
  // Destinatari
  recipientIds: string[];     // User IDs (vuoto per group)
  recipientType: 'user' | 'all' | 'masters_only';
  
  // Contenuto
  content: string;
  attachments?: {
    type: 'image' | 'file' | 'dice_roll' | 'character_sheet';
    url?: string;
    data?: any;
  }[];
  
  // Metadata
  timestamp: Date;
  edited: boolean;
  editedAt?: Date;
  deleted: boolean;
  
  // Read receipts
  readBy: {
    userId: string;
    readAt: Date;
  }[];
  
  // Thread
  replyToId?: string;         // ID messaggio a cui risponde
  threadId?: string;          // ID thread
  
  createdAt: Date;
  updatedAt: Date;
}

interface Conversation {
  id: string;
  campaignId: string;
  
  // Partecipanti
  participantIds: string[];   // User IDs
  participantNames: string[];
  
  // Tipo conversazione
  type: 'private' | 'group';
  name?: string;              // Nome gruppo (se group)
  
  // Ultimo messaggio
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Date;
  };
  
  // Unread count per user
  unreadCount: {
    [userId: string]: number;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 MessagingService

```typescript
class MessagingService {
  /**
   * Invia messaggio privato
   */
  async sendPrivateMessage(
    senderId: string,
    recipientId: string,
    content: string,
    campaignId: string,
    attachments?: any[]
  ): Promise<Message> {
    // Trova o crea conversazione
    let conversation = await this.conversationRepo.findOne({
      campaignId,
      type: 'private',
      participantIds: { $all: [senderId, recipientId] }
    });
    
    if (!conversation) {
      conversation = await this.conversationRepo.create({
        campaignId,
        type: 'private',
        participantIds: [senderId, recipientId],
        participantNames: [
          await this.getUserName(senderId),
          await this.getUserName(recipientId)
        ],
        unreadCount: {}
      });
    }
    
    // Crea messaggio
    const message = await this.messageRepo.create({
      campaignId,
      type: 'private',
      senderId,
      senderName: await this.getUserName(senderId),
      senderRole: await this.getUserRole(senderId, campaignId),
      recipientIds: [recipientId],
      recipientType: 'user',
      content,
      attachments,
      timestamp: new Date(),
      edited: false,
      deleted: false,
      readBy: [{ userId: senderId, readAt: new Date() }]
    });
    
    // Aggiorna conversazione
    conversation.lastMessage = {
      content,
      senderId,
      timestamp: message.timestamp
    };
    conversation.unreadCount[recipientId] = 
      (conversation.unreadCount[recipientId] || 0) + 1;
    await this.conversationRepo.save(conversation);
    
    // Notifica via WebSocket
    await this.websocketService.sendToUser(recipientId, {
      type: 'NEW_MESSAGE',
      message,
      conversationId: conversation.id
    });
    
    // Notifica push (se offline)
    await this.notificationService.sendPushNotification(recipientId, {
      title: `New message from ${message.senderName}`,
      body: content.substring(0, 100)
    });
    
    return message;
  }
  
  /**
   * Invia messaggio di gruppo
   */
  async sendGroupMessage(
    senderId: string,
    campaignId: string,
    content: string,
    attachments?: any[]
  ): Promise<Message> {
    const campaign = await this.campaignRepo.findById(campaignId);
    
    const message = await this.messageRepo.create({
      campaignId,
      type: 'group',
      senderId,
      senderName: await this.getUserName(senderId),
      senderRole: await this.getUserRole(senderId, campaignId),
      recipientIds: [],
      recipientType: 'all',
      content,
      attachments,
      timestamp: new Date(),
      edited: false,
      deleted: false,
      readBy: [{ userId: senderId, readAt: new Date() }]
    });
    
    // Broadcast a tutta la campagna
    await this.websocketService.broadcastToCampaign(campaignId, {
      type: 'NEW_GROUP_MESSAGE',
      message
    });
    
    return message;
  }
  
  /**
   * Invia messaggio solo ai Master
   */
  async sendToMasters(
    senderId: string,
    campaignId: string,
    content: string,
    attachments?: any[]
  ): Promise<Message> {
    const campaign = await this.campaignRepo.findById(campaignId);
    const masterIds = [campaign.masterUserId];
    
    const message = await this.messageRepo.create({
      campaignId,
      type: 'private',
      senderId,
      senderName: await this.getUserName(senderId),
      senderRole: await this.getUserRole(senderId, campaignId),
      recipientIds: masterIds,
      recipientType: 'masters_only',
      content,
      attachments,
      timestamp: new Date(),
      edited: false,
      deleted: false,
      readBy: [{ userId: senderId, readAt: new Date() }]
    });
    
    // Notifica solo ai Master
    for (const masterId of masterIds) {
      await this.websocketService.sendToUser(masterId, {
        type: 'NEW_MASTER_MESSAGE',
        message
      });
    }
    
    return message;
  }
  
  /**
   * Marca messaggio come letto
   */
  async markAsRead(
    messageId: string,
    userId: string
  ): Promise<void> {
    const message = await this.messageRepo.findById(messageId);
    
    const alreadyRead = message.readBy.some(r => r.userId === userId);
    if (!alreadyRead) {
      message.readBy.push({
        userId,
        readAt: new Date()
      });
      await this.messageRepo.save(message);
    }
    
    // Aggiorna unread count nella conversazione
    const conversation = await this.conversationRepo.findOne({
      campaignId: message.campaignId,
      participantIds: userId
    });
    
    if (conversation && conversation.unreadCount[userId] > 0) {
      conversation.unreadCount[userId]--;
      await this.conversationRepo.save(conversation);
    }
  }
  
  /**
   * Ottieni conversazioni utente
   */
  async getUserConversations(
    userId: string,
    campaignId: string
  ): Promise<Conversation[]> {
    return await this.conversationRepo.find({
      campaignId,
      participantIds: userId
    }, {
      sort: { 'lastMessage.timestamp': -1 }
    });
  }
  
  /**
   * Ottieni messaggi conversazione
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    before?: Date
  ): Promise<Message[]> {
    const conversation = await this.conversationRepo.findById(conversationId);
    
    // Verifica che l'utente faccia parte della conversazione
    if (!conversation.participantIds.includes(userId)) {
      throw new Error('Unauthorized');
    }
    
    const query: any = {
      campaignId: conversation.campaignId,
      deleted: false
    };
    
    if (conversation.type === 'private') {
      query.$or = [
        { senderId: userId, recipientIds: { $in: conversation.participantIds } },
        { senderId: { $in: conversation.participantIds }, recipientIds: userId }
      ];
    } else {
      query.type = 'group';
    }
    
    if (before) {
      query.timestamp = { $lt: before };
    }
    
    return await this.messageRepo.find(query, {
      sort: { timestamp: -1 },
      limit
    });
  }
  
  /**
   * Condividi tiro di dado in chat
   */
  async shareDiceRoll(
    senderId: string,
    campaignId: string,
    rollEvent: GameEvent,
    recipientIds?: string[]
  ): Promise<Message> {
    const content = this.formatDiceRollMessage(rollEvent);
    
    if (recipientIds && recipientIds.length > 0) {
      // Messaggio privato
      return await this.sendPrivateMessage(
        senderId,
        recipientIds[0],
        content,
        campaignId,
        [{
          type: 'dice_roll',
          data: rollEvent
        }]
      );
    } else {
      // Messaggio di gruppo
      return await this.sendGroupMessage(
        senderId,
        campaignId,
        content,
        [{
          type: 'dice_roll',
          data: rollEvent
        }]
      );
    }
  }
  
  private formatDiceRollMessage(rollEvent: GameEvent): string {
    const result = rollEvent.result;
    return `🎲 Rolled ${result.total} (${result.usedRoll} + ${result.modifier})`;
  }
}
```

### 3.3 Real-time Messaging

```typescript
// WebSocket events per messaggistica
class MessagingWebSocketHandler {
  setupHandlers(socket: Socket): void {
    // Join chat room
    socket.on('join_chat', async (campaignId: string) => {
      socket.join(`chat:${campaignId}`);
    });
    
    // Typing indicator
    socket.on('typing_start', async (data: {
      conversationId: string;
      userId: string;
      userName: string;
    }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        userId: data.userId,
        userName: data.userName
      });
    });
    
    socket.on('typing_stop', async (data: {
      conversationId: string;
      userId: string;
    }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_stopped_typing', {
        userId: data.userId
      });
    });
    
    // Message reactions
    socket.on('add_reaction', async (data: {
      messageId: string;
      emoji: string;
      userId: string;
    }) => {
      await this.messagingService.addReaction(
        data.messageId,
        data.userId,
        data.emoji
      );
      
      const message = await this.messageRepo.findById(data.messageId);
      socket.to(`chat:${message.campaignId}`).emit('reaction_added', data);
    });
  }
}
```

---

## 4. Master Dashboard

### 4.1 Dashboard Overview

```typescript
interface MasterDashboard {
  campaign: Campaign;
  
  // Sessione corrente
  currentSession?: {
    id: string;
    status: 'active' | 'paused';
    startTime: Date;
    duration: number;
    activePlayers: number;
  };
  
  // Combattimento corrente
  currentCombat?: {
    id: string;
    round: number;
    activeParticipant: string;
    participantCount: number;
  };
  
  // Statistiche sessione
  sessionStats: {
    totalDamage: number;
    totalHealing: number;
    spellsCast: number;
    criticalHits: number;
  };
  
  // Quick actions
  quickActions: {
    startCombat: boolean;
    endCombat: boolean;
    addNPC: boolean;
    rollSecretDice: boolean;
    sendMessage: boolean;
  };
  
  // Notifiche
  notifications: {
    unreadMessages: number;
    pendingActions: number;
    lowHPCharacters: string[];
  };
}
```

### 4.2 Master Quick Actions

```typescript
class MasterQuickActionsService {
  /**
   * Pausa/Riprendi sessione
   */
  async toggleSessionPause(
    sessionId: string,
    masterUserId: string
  ): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    
    if (session.masterUserId !== masterUserId) {
      throw new Error('Unauthorized');
    }
    
    session.status = session.status === 'active' ? 'paused' : 'active';
    await this.sessionRepo.save(session);
    
    await this.websocketService.broadcastToSession(sessionId, {
      type: 'SESSION_STATUS_CHANGED',
      status: session.status
    });
  }
  
  /**
   * Termina sessione
   */
  async endSession(
    sessionId: string,
    masterUserId: string,
    summary?: string
  ): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    
    if (session.masterUserId !== masterUserId) {
      throw new Error('Unauthorized');
    }
    
    session.status = 'completed';
    session.endTime = new Date();
    session.summary = summary;
    
    await this.sessionRepo.save(session);
    
    await this.websocketService.broadcastToSession(sessionId, {
      type: 'SESSION_ENDED',
      summary
    });
  }
}
```

---

## 5. NPC Management

### 5.1 NPC Database Schema

```typescript
interface NPC {
  id: string;
  campaignId: string;
  
  // Basic info
  name: string;
  type: 'friendly' | 'neutral' | 'hostile' | 'ally';
  race?: string;
  class?: string;
  
  // Stats
  level?: number;
  armorClass: number;
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  
  // Abilities
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  
  // Combat
  initiative: number;
  speed: number;
  attacks: {
    name: string;
    attackBonus: number;
    damageFormula: string;
    damageType: string;
  }[];
  
  // Features
  features: string[];
  spells?: string[];
  
  // Notes
  description?: string;
  notes?: string;
  imageUrl?: string;
  
  // Visibility
  visibleToPlayers: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 NPCService

```typescript
class NPCService {
  async createNPC(
    campaignId: string,
    npcData: Partial<NPC>,
    masterUserId: string
  ): Promise<NPC> {
    await this.verifyMasterPermission(campaignId, masterUserId);
    
    const npc = await this.npcRepo.create({
      ...npcData,
      campaignId,
      hitPoints: {
        current: npcData.hitPoints?.max || 0,
        max: npcData.hitPoints?.max || 0,
        temporary: 0
      }
    });
    
    return npc;
  }
  
  async importMonsterFromSRD(
    campaignId: string,
    monsterName: string,
    masterUserId: string
  ): Promise<NPC> {
    await this.verifyMasterPermission(campaignId, masterUserId);
    
    // Fetch da SRD API
    const monsterData = await this.srdService.getMonster(monsterName);
    
    return await this.createNPC(campaignId, {
      name: monsterData.name,
      type: 'hostile',
      armorClass: monsterData.armor_class,
      hitPoints: {
        max: monsterData.hit_points,
        current: monsterData.hit_points,
        temporary: 0
      },
      abilityScores: monsterData.ability_scores,
      attacks: monsterData.actions,
      features: monsterData.special_abilities
    }, masterUserId);
  }
}
```

---

## 6. Encounter Builder

### 6.1 Encounter Schema

```typescript
interface Encounter {
  id: string;
  campaignId: string;
  
  name: string;
  description?: string;
  
  // Partecipanti
  npcs: {
    npcId: string;
    count: number;
    initiative?: number;
  }[];
  
  // Difficulty
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  calculatedXP: number;
  adjustedXP: number;
  
  // Environment
  terrain?: string;
  lighting?: string;
  weather?: string;
  
  // Notes
  tactics?: string;
  treasures?: string[];
  
  // Status
  status: 'planned' | 'active' | 'completed';
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.2 EncounterBuilderService

```typescript
class EncounterBuilderService {
  /**
   * Calcola difficoltà encounter
   */
  calculateDifficulty(
    partyLevel: number,
    partySize: number,
    totalMonsterXP: number
  ): {
    difficulty: string;
    adjustedXP: number;
    thresholds: {
      easy: number;
      medium: number;
      hard: number;
      deadly: number;
    };
  } {
    // XP thresholds per livello (D&D 5E)
    const xpThresholds = this.getXPThresholds(partyLevel);
    
    // Moltiplica per numero giocatori
    const thresholds = {
      easy: xpThresholds.easy * partySize,
      medium: xpThresholds.medium * partySize,
      hard: xpThresholds.hard * partySize,
      deadly: xpThresholds.deadly * partySize
    };
    
    // Adjusted XP basato su numero mostri
    const multiplier = this.getXPMultiplier(partySize);
    const adjustedXP = totalMonsterXP * multiplier;
    
    // Determina difficoltà
    let difficulty: string;
    if (adjustedXP < thresholds.easy) {
      difficulty = 'trivial';
    } else if (adjustedXP < thresholds.medium) {
      difficulty = 'easy';
    } else if (adjustedXP < thresholds.hard) {
      difficulty = 'medium';
    } else if (adjustedXP < thresholds.deadly) {
      difficulty = 'hard';
    } else {
      difficulty = 'deadly';
    }
    
    return {
      difficulty,
      adjustedXP,
      thresholds
    };
  }
  
  /**
   * Avvia encounter
   */
  async startEncounter(
    encounterId: string,
    sessionId: string,
    masterUserId: string
  ): Promise<CombatEncounter> {
    const encounter = await this.encounterRepo.findById(encounterId);
    const session = await this.sessionRepo.findById(sessionId);
    
    if (session.masterUserId !== masterUserId) {
      throw new Error('Unauthorized');
    }
    
    // Crea partecipanti da encounter
    const participants: any[] = [];
    
    // Aggiungi PCs
    for (const charId of session.playerCharacterIds) {
      const character = await this.characterRepo.findById(charId);
      participants.push({
        characterId: charId,
        name: character.name,
        type: 'pc',
        initiative: await this.rollInitiative(character),
        initiativeModifier: character.dexterityModifier,
        maxHp: character.maxHitPoints,
        currentHp: character.currentHitPoints
      });
    }
    
    // Aggiungi NPCs
    for (const npcEntry of encounter.npcs) {
      const npc = await this.npcRepo.findById(npcEntry.npcId);
      
      for (let i = 0; i < npcEntry.count; i++) {
        participants.push({
          npcId: npc.id,
          name: npcEntry.count > 1 ? `${npc.name} ${i + 1}` : npc.name,
          type: 'monster',
          initiative: npcEntry.initiative || await this.rollInitiative(npc),
          initiativeModifier: npc.dexterityModifier || 0,
          maxHp: npc.hitPoints.max,
          currentHp: npc.hitPoints.max
        });
      }
    }
    
    // Avvia combattimento
    const combat = await this.combatService.startCombat(
      sessionId,
      participants
    );
    
    encounter.status = 'active';
    await this.encounterRepo.save(encounter);
    
    return combat;
  }
}
```

---

## 7. Session Notes

### 7.1 Notes Schema

```typescript
interface SessionNote {
  id: string;
  sessionId: string;
  campaignId: string;
  
  // Autore
  authorId: string;
  authorName: string;
  authorRole: 'master' | 'player';
  
  // Contenuto
  title: string;
  content: string;
  tags: string[];
  
  // Visibility
  visibility: 'public' | 'master_only' | 'private';
  
  // Metadata
  timestamp: Date;
  edited: boolean;
  editedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 8. Database Schema

Aggiunte alle tabelle esistenti:

```typescript
// Aggiungi a CombatParticipant
interface CombatParticipant {
  // ... campi esistenti ...
  hidden: boolean;           // Visibile solo al Master
  armorClass?: number;       // AC per quick reference
}

// Nuove tabelle
interface Message { /* vedi sezione 3.1 */ }
interface Conversation { /* vedi sezione 3.1 */ }
interface NPC { /* vedi sezione 5.1 */ }
interface Encounter { /* vedi sezione 6.1 */ }
interface SessionNote { /* vedi sezione 7.1 */ }
```

---

## 9. API Endpoints

### 9.1 Master Combat

```
POST   /api/combat/:id/add-npc              # Aggiungi NPC
DELETE /api/combat/:id/participant/:pid     # Rimuovi partecipante
PUT    /api/combat/:id/participant/:pid/hp  # Modifica HP
POST   /api/combat/:id/secret-roll          # Tiro segreto
POST   /api/combat/:id/reveal-roll/:eventId # Rivela tiro
POST   /api/combat/:id/aoe-damage           # Danno area
POST   /api/combat/:id/bulk-condition       # Condizione multipla
```

### 9.2 Messaging

```
POST   /api/messages/private                # Messaggio privato
POST   /api/messages/group                  # Messaggio gruppo
POST   /api/messages/masters                # Messaggio a Master
GET    /api/conversations/:campaignId       # Lista conversazioni
GET    /api/conversations/:id/messages      # Messaggi conversazione
PUT    /api/messages/:id/read               # Marca come letto
POST   /api/messages/:id/reaction           # Aggiungi reaction
POST   /api/messages/share-roll             # Condividi tiro
```

### 9.3 NPC Management

```
POST   /api/npcs                            # Crea NPC
GET    /api/npcs/:campaignId                # Lista NPC
GET    /api/npcs/:id                        # Dettagli NPC
PUT    /api/npcs/:id                        # Aggiorna NPC
DELETE /api/npcs/:id                        # Elimina NPC
POST   /api/npcs/import-srd                 # Importa da SRD
```

### 9.4 Encounter Builder

```
POST   /api/encounters                      # Crea encounter
GET    /api/encounters/:campaignId          # Lista encounters
GET    /api/encounters/:id                  # Dettagli encounter
PUT    /api/encounters/:id                  # Aggiorna encounter
DELETE /api/encounters/:id                  # Elimina encounter
POST   /api/encounters/:id/start            # Avvia encounter
POST   /api/encounters/calculate-difficulty # Calcola difficoltà
```

### 9.5 Session Notes

```
POST   /api/notes                           # Crea nota
GET    /api/notes/:sessionId                # Lista note sessione
GET    /api/notes/:id                       # Dettagli nota
PUT    /api/notes/:id                       # Aggiorna nota
DELETE /api/notes/:id                       # Elimina nota
```

---

## 10. Frontend Components

### 10.1 Master Combat Panel

```typescript
// MasterCombatPanel.tsx
export function MasterCombatPanel({ combatId }: { combatId: string }) {
  const { combat, addNPC, removeParticipant, setHP } = useMasterCombat(combatId);
  const [showAddNPC, setShowAddNPC] = useState(false);
  
  return (
    <div className="master-combat-panel">
      <div className="combat-controls">
        <Button onClick={() => setShowAddNPC(true)}>
          Add NPC
        </Button>
        <Button onClick={() => makeSecretRoll()}>
          Secret Roll
        </Button>
        <Button onClick={() => applyAOEDamage()}>
          AOE Damage
        </Button>
      </div>
      
      <div className="participants-list">
        {combat.participants.map(p => (
          <MasterParticipantCard
            key={p.id}
            participant={p}
            onRemove={() => removeParticipant(p.id)}
            onSetHP={(hp) => setHP(p.id, hp)}
          />
        ))}
      </div>
      
      {showAddNPC && (
        <AddNPCDialog
          onAdd={(npc) => addNPC(npc)}
          onClose={() => setShowAddNPC(false)}
        />
      )}
    </div>
  );
}
```

### 10.2 Messaging Component

```typescript
// MessagingPanel.tsx
export function MessagingPanel({ campaignId, userId }: MessagingPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { sendMessage, markAsRead } = useMessaging(campaignId);
  
  return (
    <div className="messaging-panel">
      <div className="conversations-list">
        <Button onClick={() => startNewConversation()}>
          New Message
        </Button>
        
        {conversations.map(conv => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            selected={selectedConversation === conv.id}
            onClick={() => setSelectedConversation(conv.id)}
            unreadCount={conv.unreadCount[userId]}
          />
        ))}
      </div>
      
      <div className="messages-view">
        {selectedConversation && (
          <>
            <MessageList
              messages={messages}
              currentUserId={userId}
              onReaction={(msgId, emoji) => addReaction(msgId, emoji)}
            />
            
            <MessageInput
              onSend={(content) => sendMessage(selectedConversation, content)}
              onTyping={() => sendTypingIndicator()}
            />
          </>
        )}
      </div>
    </div>
  );
}
```

### 10.3 Encounter Builder

```typescript
// EncounterBuilder.tsx
export function EncounterBuilder({ campaignId }: { campaignId: string }) {
  const [encounter, setEncounter] = useState<Partial<Encounter>>({
    npcs: []
  });
  const [difficulty, setDifficulty] = useState<any>(null);
  const { npcs } = useNPCs(campaignId);
  
  const addNPCToEncounter = (npcId: string, count: number) => {
    setEncounter(prev => ({
      ...prev,
      npcs: [...(prev.npcs || []), { npcId, count }]
    }));
    
    // Ricalcola difficoltà
    calculateDifficulty();
  };
  
  return (
    <div className="encounter-builder">
      <TextField
        label="Encounter Name"
        value={encounter.name}
        onChange={(e) => setEncounter({ ...encounter, name: e.target.value })}
      />
      
      <div className="npc-selection">
        <h3>Add NPCs</h3>
        {npcs.map(npc => (
          <NPCCard
            key={npc.id}
            npc={npc}
            onAdd={(count) => addNPCToEncounter(npc.id, count)}
          />
        ))}
      </div>
      
      <div className="encounter-npcs">
        <h3>Encounter Participants</h3>
        {encounter.npcs?.map((entry, index) => (
          <EncounterNPCEntry
            key={index}
            entry={entry}
            onRemove={() => removeNPC(index)}
            onChangeCount={(count) => updateNPCCount(index, count)}
          />
        ))}
      </div>
      
      {difficulty && (
        <DifficultyIndicator difficulty={difficulty} />
      )}
      
      <Button onClick={() => saveEncounter()}>
        Save Encounter
      </Button>
    </div>
  );
}
```

---

## Conclusione

Questo sistema fornisce al Master tutti gli strumenti necessari per gestire efficacemente le sessioni di gioco:

✅ **Combat Management** - Controllo completo su combattimenti con NPC nascosti e tiri segreti
✅ **Private Messaging** - Chat private Master-Player e Player-Player
✅ **Group Chat** - Chat di gruppo per tutta la campagna
✅ **NPC Management** - Gestione completa NPC con import da SRD
✅ **Encounter Builder** - Costruttore encounter con calcolo difficoltà automatico
✅ **Session Notes** - Note condivise o private
✅ **Bulk Operations** - Operazioni multiple (AOE damage, condizioni)
✅ **Real-time Updates** - Sincronizzazione istantanea via WebSocket
✅ **Master Dashboard** - Panoramica completa della sessione

Il sistema è progettato per facilitare il lavoro del Master mantenendo il controllo completo sulla sessione e permettendo una comunicazione fluida con i giocatori.