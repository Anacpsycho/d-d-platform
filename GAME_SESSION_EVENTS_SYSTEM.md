# Game Session Events System - Sistema di Gestione Eventi di Gioco

## Indice

1. [Panoramica Sistema](#1-panoramica-sistema)
2. [Database Schema](#2-database-schema)
3. [Tipi di Eventi](#3-tipi-di-eventi)
4. [Gestione HP e Danni](#4-gestione-hp-e-danni)
5. [Sistema Riposi](#5-sistema-riposi)
6. [Sistema Tiri Dadi](#6-sistema-tiri-dadi)
7. [Gestione Risorse](#7-gestione-risorse)
8. [Combat Tracker](#8-combat-tracker)
9. [Spell Casting Events](#9-spell-casting-events)
10. [Condizioni e Status Effects](#10-condizioni-e-status-effects)
11. [Event Log e History](#11-event-log-e-history)
12. [Real-time Synchronization](#12-real-time-synchronization)
13. [API Endpoints](#13-api-endpoints)

---

## 1. Panoramica Sistema

Il sistema di eventi di gioco gestisce tutte le azioni che avvengono durante una sessione di D&D, inclusi danni, cure, riposi, tiri di dado, uso di risorse, combattimenti e molto altro.

### Architettura Event-Driven

```
┌─────────────────┐
│  Frontend       │
│  (User Action)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  WebSocket/API  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Event Processor │
│  (Backend)      │
└────────┬────────┘
         │
         ├──► Validate Rules
         ├──► Calculate Effects
         ├──► Update Character State
         ├──► Save Event to DB
         └──► Broadcast to Campaign
                │
                ▼
         ┌─────────────────┐
         │  All Clients    │
         │  (Real-time)    │
         └─────────────────┘
```

### Principi Chiave

1. **Event Sourcing**: Ogni evento è salvato come record immutabile
2. **Real-time Sync**: Aggiornamenti istantanei via WebSocket
3. **Rule Validation**: Regole D&D 5E applicate automaticamente
4. **Audit Trail**: Storia completa di tutti gli eventi
5. **Rollback Capability**: Possibilità di annullare eventi

---

## 2. Database Schema

### 2.1 GameSession Table

```typescript
interface GameSession {
  id: string;                    // UUID
  campaignId: string;            // FK to Campaign
  sessionNumber: number;         // Numero sessione nella campagna
  sessionDate: Date;             // Data della sessione
  startTime: Date;               // Inizio sessione
  endTime?: Date;                // Fine sessione (null se in corso)
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  
  // Partecipanti
  masterUserId: string;          // FK to User (DM)
  playerCharacterIds: string[];  // FK to CharacterSheet[]
  
  // Stato sessione
  currentCombatId?: string;      // FK to CombatEncounter (se in combattimento)
  inGameDate?: string;           // Data nel mondo di gioco
  location?: string;             // Luogo attuale
  
  // Metadata
  notes?: string;                // Note della sessione
  summary?: string;              // Riassunto post-sessione
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 GameEvent Table

```typescript
interface GameEvent {
  id: string;                    // UUID
  sessionId: string;             // FK to GameSession
  campaignId: string;            // FK to Campaign (per query veloci)
  
  // Tipo evento
  eventType: GameEventType;      // Enum dei tipi di evento
  
  // Chi/Cosa
  actorId?: string;              // Chi ha causato l'evento (character/user)
  actorType: 'character' | 'npc' | 'environment' | 'system';
  targetId?: string;             // Chi è stato affetto (character)
  targetType?: 'character' | 'npc' | 'object';
  
  // Dati evento
  eventData: Record<string, any>; // Dati specifici dell'evento (JSON)
  result: Record<string, any>;    // Risultato calcolato (JSON)
  
  // Metadata
  timestamp: Date;               // Quando è avvenuto
  roundNumber?: number;          // Round di combattimento (se applicabile)
  turnOrder?: number;            // Ordine nel turno (se applicabile)
  
  // Rollback
  canRollback: boolean;          // Se può essere annullato
  rolledBack: boolean;           // Se è stato annullato
  rollbackEventId?: string;      // FK to GameEvent (evento di rollback)
  
  createdAt: Date;
}
```

### 2.3 CombatEncounter Table

```typescript
interface CombatEncounter {
  id: string;                    // UUID
  sessionId: string;             // FK to GameSession
  campaignId: string;            // FK to Campaign
  
  // Stato combattimento
  status: 'preparing' | 'active' | 'completed';
  currentRound: number;          // Round corrente
  currentTurnIndex: number;      // Indice del turno corrente
  
  // Partecipanti
  participants: CombatParticipant[];
  
  // Metadata
  startTime: Date;
  endTime?: Date;
  location?: string;
  description?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

interface CombatParticipant {
  id: string;                    // UUID
  characterId?: string;          // FK to CharacterSheet (se PC)
  npcId?: string;                // ID NPC (se NPC)
  name: string;                  // Nome visualizzato
  type: 'pc' | 'npc' | 'monster';
  
  // Iniziativa
  initiative: number;            // Valore iniziativa
  initiativeModifier: number;    // Modificatore usato
  
  // Stato
  isActive: boolean;             // Se è il suo turno
  isDefeated: boolean;           // Se è sconfitto
  conditions: string[];          // Condizioni attive
  
  // HP tracking
  currentHp: number;
  maxHp: number;
  temporaryHp: number;
}
```

### 2.4 CharacterSheet Updates

Aggiunte al CharacterSheet esistente per tracking stato corrente:

```typescript
interface CharacterSheet {
  // ... campi esistenti ...
  
  // Current State (runtime)
  currentHitPoints: number;
  temporaryHitPoints: number;
  
  // Spell Slots Usage
  currentSpellSlots: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
    level6: number;
    level7: number;
    level8: number;
    level9: number;
  };
  
  // Hit Dice Usage
  currentHitDice: {
    [diceType: string]: number;  // es. "d8": 3
  };
  
  // Features Usage
  currentFeatures: {
    [featureName: string]: {
      usesRemaining: number;
      maxUses: number;
      resetOn: 'short_rest' | 'long_rest' | 'dawn' | 'manual';
    };
  };
  
  // Conditions
  activeConditions: {
    name: string;
    source?: string;
    duration?: number;           // Rounds/minutes
    saveDC?: number;
    saveAbility?: string;
  }[];
  
  // Death Saves
  deathSaves: {
    successes: number;           // 0-3
    failures: number;            // 0-3
  };
  
  // Combat State
  inCombat: boolean;
  initiative?: number;
  
  // Concentration
  concentratingOn?: {
    spellName: string;
    spellLevel: number;
    startedAt: Date;
  };
  
  // Last Session
  lastSessionId?: string;
  lastUpdated: Date;
}
```

---

## 3. Tipi di Eventi

### 3.1 GameEventType Enum

```typescript
enum GameEventType {
  // HP Events
  DAMAGE_TAKEN = 'DAMAGE_TAKEN',
  HEALING_RECEIVED = 'HEALING_RECEIVED',
  TEMP_HP_GAINED = 'TEMP_HP_GAINED',
  TEMP_HP_LOST = 'TEMP_HP_LOST',
  
  // Rest Events
  SHORT_REST = 'SHORT_REST',
  LONG_REST = 'LONG_REST',
  
  // Dice Rolls
  ABILITY_CHECK = 'ABILITY_CHECK',
  SAVING_THROW = 'SAVING_THROW',
  ATTACK_ROLL = 'ATTACK_ROLL',
  DAMAGE_ROLL = 'DAMAGE_ROLL',
  SKILL_CHECK = 'SKILL_CHECK',
  INITIATIVE_ROLL = 'INITIATIVE_ROLL',
  
  // Spell Events
  SPELL_CAST = 'SPELL_CAST',
  SPELL_SLOT_USED = 'SPELL_SLOT_USED',
  SPELL_SLOT_RECOVERED = 'SPELL_SLOT_RECOVERED',
  CONCENTRATION_START = 'CONCENTRATION_START',
  CONCENTRATION_END = 'CONCENTRATION_END',
  CONCENTRATION_CHECK = 'CONCENTRATION_CHECK',
  
  // Feature Events
  FEATURE_USED = 'FEATURE_USED',
  FEATURE_RECOVERED = 'FEATURE_RECOVERED',
  
  // Hit Dice Events
  HIT_DICE_USED = 'HIT_DICE_USED',
  HIT_DICE_RECOVERED = 'HIT_DICE_RECOVERED',
  
  // Combat Events
  COMBAT_STARTED = 'COMBAT_STARTED',
  COMBAT_ENDED = 'COMBAT_ENDED',
  TURN_STARTED = 'TURN_STARTED',
  TURN_ENDED = 'TURN_ENDED',
  ROUND_STARTED = 'ROUND_STARTED',
  
  // Condition Events
  CONDITION_APPLIED = 'CONDITION_APPLIED',
  CONDITION_REMOVED = 'CONDITION_REMOVED',
  
  // Death Events
  DEATH_SAVE = 'DEATH_SAVE',
  UNCONSCIOUS = 'UNCONSCIOUS',
  STABILIZED = 'STABILIZED',
  REVIVED = 'REVIVED',
  CHARACTER_DEATH = 'CHARACTER_DEATH',
  
  // Experience Events
  XP_GAINED = 'XP_GAINED',
  LEVEL_UP = 'LEVEL_UP',
  
  // Item Events
  ITEM_EQUIPPED = 'ITEM_EQUIPPED',
  ITEM_UNEQUIPPED = 'ITEM_UNEQUIPPED',
  ITEM_USED = 'ITEM_USED',
  
  // Custom Events
  CUSTOM_EVENT = 'CUSTOM_EVENT'
}
```

---

## 4. Gestione HP e Danni

### 4.1 DamageService - Applicazione Danni

```typescript
class DamageService {
  async applyDamage(
    characterId: string,
    damage: number,
    damageType: DamageType,
    source: string,
    sessionId: string
  ): Promise<GameEvent> {
    const character = await this.characterRepo.findById(characterId);
    
    // Calcola danno effettivo con resistenze/immunità/vulnerabilità
    const effectiveDamage = this.calculateEffectiveDamage(
      character,
      damage,
      damageType
    );
    
    // Applica danno (prima temp HP, poi HP normali)
    const damageResult = this.applyDamageToHp(
      character.temporaryHitPoints,
      character.currentHitPoints,
      effectiveDamage
    );
    
    // Aggiorna character
    character.temporaryHitPoints = damageResult.newTempHp;
    character.currentHitPoints = damageResult.newHp;
    
    // Verifica unconscious/morte
    if (character.currentHitPoints <= 0) {
      await this.handleUnconscious(character, sessionId);
    }
    
    // Verifica concentration
    if (character.concentratingOn) {
      await this.checkConcentration(character, effectiveDamage, sessionId);
    }
    
    await this.characterRepo.save(character);
    
    // Crea evento
    const event = await this.eventRepo.create({
      sessionId,
      campaignId: character.campaignId,
      eventType: GameEventType.DAMAGE_TAKEN,
      actorType: 'environment',
      targetId: characterId,
      targetType: 'character',
      eventData: {
        rawDamage: damage,
        damageType,
        source,
        hadResistance: effectiveDamage < damage,
        hadVulnerability: effectiveDamage > damage,
        hadImmunity: effectiveDamage === 0
      },
      result: {
        effectiveDamage,
        tempHpLost: damageResult.tempHpLost,
        hpLost: damageResult.hpLost,
        newTempHp: damageResult.newTempHp,
        newHp: damageResult.newHp,
        becameUnconscious: character.currentHitPoints <= 0
      },
      timestamp: new Date(),
      canRollback: true,
      rolledBack: false
    });
    
    // Broadcast
    await this.websocketService.broadcastToSession(sessionId, {
      type: 'DAMAGE_TAKEN',
      characterId,
      event
    });
    
    return event;
  }
  
  private calculateEffectiveDamage(
    character: CharacterSheet,
    damage: number,
    damageType: DamageType
  ): number {
    // Immunità = 0 danno
    if (character.damageImmunities?.includes(damageType)) {
      return 0;
    }
    
    // Resistenza = metà danno (arrotondato per difetto)
    if (character.damageResistances?.includes(damageType)) {
      return Math.floor(damage / 2);
    }
    
    // Vulnerabilità = doppio danno
    if (character.damageVulnerabilities?.includes(damageType)) {
      return damage * 2;
    }
    
    return damage;
  }
  
  private applyDamageToHp(
    tempHp: number,
    currentHp: number,
    damage: number
  ): {
    newTempHp: number;
    newHp: number;
    tempHpLost: number;
    hpLost: number;
  } {
    let remainingDamage = damage;
    let newTempHp = tempHp;
    let newHp = currentHp;
    
    // Prima sottrai da temp HP
    if (tempHp > 0) {
      if (remainingDamage >= tempHp) {
        remainingDamage -= tempHp;
        newTempHp = 0;
      } else {
        newTempHp = tempHp - remainingDamage;
        remainingDamage = 0;
      }
    }
    
    // Poi sottrai da HP normali
    if (remainingDamage > 0) {
      newHp = currentHp - remainingDamage;
    }
    
    return {
      newTempHp,
      newHp,
      tempHpLost: tempHp - newTempHp,
      hpLost: currentHp - newHp
    };
  }
}
```

### 4.2 HealingService - Applicazione Cure

```typescript
class HealingService {
  async applyHealing(
    characterId: string,
    healing: number,
    source: string,
    sessionId: string
  ): Promise<GameEvent> {
    const character = await this.characterRepo.findById(characterId);
    
    const oldHp = character.currentHitPoints;
    const newHp = Math.min(
      character.currentHitPoints + healing,
      character.maxHitPoints
    );
    const actualHealing = newHp - oldHp;
    
    character.currentHitPoints = newHp;
    
    // Se era unconscious e torna > 0, rimuovi condizione
    if (oldHp <= 0 && newHp > 0) {
      await this.handleRevive(character, sessionId);
    }
    
    await this.characterRepo.save(character);
    
    const event = await this.eventRepo.create({
      sessionId,
      campaignId: character.campaignId,
      eventType: GameEventType.HEALING_RECEIVED,
      actorType: 'character',
      targetId: characterId,
      targetType: 'character',
      eventData: {
        potentialHealing: healing,
        source
      },
      result: {
        actualHealing,
        oldHp,
        newHp,
        wasRevived: oldHp <= 0 && newHp > 0
      },
      timestamp: new Date(),
      canRollback: true,
      rolledBack: false
    });
    
    await this.websocketService.broadcastToSession(sessionId, {
      type: 'HEALING_RECEIVED',
      characterId,
      event
    });
    
    return event;
  }
  
  async applyTemporaryHp(
    characterId: string,
    tempHp: number,
    source: string,
    sessionId: string
  ): Promise<GameEvent> {
    const character = await this.characterRepo.findById(characterId);
    
    // Temp HP non si sommano, si prende il valore più alto
    const oldTempHp = character.temporaryHitPoints;
    const newTempHp = Math.max(oldTempHp, tempHp);
    
    character.temporaryHitPoints = newTempHp;
    await this.characterRepo.save(character);
    
    const event = await this.eventRepo.create({
      sessionId,
      campaignId: character.campaignId,
      eventType: GameEventType.TEMP_HP_GAINED,
      targetId: characterId,
      targetType: 'character',
      eventData: {
        tempHpGained: tempHp,
        source
      },
      result: {
        oldTempHp,
        newTempHp,
        wasReplaced: newTempHp === tempHp && oldTempHp > 0
      },
      timestamp: new Date(),
      canRollback: true,
      rolledBack: false
    });
    
    await this.websocketService.broadcastToSession(sessionId, {
      type: 'TEMP_HP_GAINED',
      characterId,
      event
    });
    
    return event;
  }
}
 Termina combattimento
GET    /api/sessions/:id/combat         # Stato combattimento corrente
PUT    /api/sessions/:id/combat/participant/:participantId  # Aggiorna partecipante
```

### 13.6 Conditions

```
POST   /api/sessions/:id/condition/apply    # Applica condizione
POST   /api/sessions/:id/condition/remove   # Rimuovi condizione
POST   /api/sessions/:id/death-save         # Tiro salvezza morte
```

### 13.7 Spells

```
POST   /api/sessions/:id/cast-spell         # Lancia spell
POST   /api/sessions/:id/concentration/end  # Termina concentration
POST   /api/sessions/:id/concentration/check # Check concentration
```

### 13.8 Event Log

```
GET    /api/sessions/:id/events             # Lista eventi sessione
GET    /api/combat/:id/events               # Eventi combattimento
GET    /api/characters/:id/events           # Storia eventi character
POST   /api/events/:id/rollback             # Rollback evento
```

### 13.9 Request/Response Examples

#### Apply Damage

**Request:**
```json
POST /api/sessions/abc123/damage
{
  "characterId": "char456",
  "damage": 15,
  "damageType": "fire",
  "source": "Fireball"
}
```

**Response:**
```json
{
  "event": {
    "id": "evt789",
    "eventType": "DAMAGE_TAKEN",
    "targetId": "char456",
    "eventData": {
      "rawDamage": 15,
      "damageType": "fire",
      "source": "Fireball",
      "hadResistance": true
    },
    "result": {
      "effectiveDamage": 7,
      "tempHpLost": 0,
      "hpLost": 7,
      "newTempHp": 0,
      "newHp": 38,
      "becameUnconscious": false
    },
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

#### Start Combat

**Request:**
```json
POST /api/sessions/abc123/combat/start
{
  "participants": [
    {
      "characterId": "char456",
      "name": "Seraphine",
      "type": "pc",
      "initiative": 18,
      "initiativeModifier": 2,
      "maxHp": 45,
      "currentHp": 45
    },
    {
      "npcId": "npc789",
      "name": "Goblin",
      "type": "monster",
      "initiative": 12,
      "initiativeModifier": 2,
      "maxHp": 7,
      "currentHp": 7
    }
  ]
}
```

**Response:**
```json
{
  "combat": {
    "id": "combat123",
    "status": "active",
    "currentRound": 1,
    "currentTurnIndex": 0,
    "participants": [
      {
        "id": "part1",
        "characterId": "char456",
        "name": "Seraphine",
        "initiative": 18,
        "isActive": true,
        "currentHp": 45
      },
      {
        "id": "part2",
        "npcId": "npc789",
        "name": "Goblin",
        "initiative": 12,
        "isActive": false,
        "currentHp": 7
      }
    ]
  }
}
```

---

## 14. Frontend Integration Examples

### 14.1 Combat Tracker Component

```typescript
// CombatTracker.tsx
export function CombatTracker({ sessionId }: { sessionId: string }) {
  const { combat, events } = useGameSession(sessionId);
  
  if (!combat) {
    return <div>No active combat</div>;
  }
  
  return (
    <div className="combat-tracker">
      <h2>Combat - Round {combat.currentRound}</h2>
      
      <div className="initiative-order">
        {combat.participants.map((participant) => (
          <div 
            key={participant.id}
            className={participant.isActive ? 'active' : ''}
          >
            <span>{participant.name}</span>
            <span>Initiative: {participant.initiative}</span>
            <HealthBar 
              current={participant.currentHp}
              max={participant.maxHp}
              temp={participant.temporaryHp}
            />
            {participant.conditions.length > 0 && (
              <div className="conditions">
                {participant.conditions.map(c => (
                  <Badge key={c}>{c}</Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button onClick={() => nextTurn(combat.id)}>
        Next Turn
      </button>
    </div>
  );
}
```

### 14.2 Damage Application Component

```typescript
// DamageDialog.tsx
export function DamageDialog({ 
  characterId, 
  sessionId,
  onClose 
}: DamageDialogProps) {
  const [damage, setDamage] = useState(0);
  const [damageType, setDamageType] = useState('slashing');
  const [source, setSource] = useState('');
  const { applyDamage } = useGameSession(sessionId);
  
  const handleSubmit = async () => {
    await applyDamage(characterId, damage, damageType, source);
    onClose();
  };
  
  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Apply Damage</DialogTitle>
      <DialogContent>
        <TextField
          label="Damage"
          type="number"
          value={damage}
          onChange={(e) => setDamage(Number(e.target.value))}
        />
        
        <Select
          label="Damage Type"
          value={damageType}
          onChange={(e) => setDamageType(e.target.value)}
        >
          <MenuItem value="slashing">Slashing</MenuItem>
          <MenuItem value="piercing">Piercing</MenuItem>
          <MenuItem value="bludgeoning">Bludgeoning</MenuItem>
          <MenuItem value="fire">Fire</MenuItem>
          <MenuItem value="cold">Cold</MenuItem>
          <MenuItem value="lightning">Lightning</MenuItem>
          <MenuItem value="thunder">Thunder</MenuItem>
          <MenuItem value="acid">Acid</MenuItem>
          <MenuItem value="poison">Poison</MenuItem>
          <MenuItem value="necrotic">Necrotic</MenuItem>
          <MenuItem value="radiant">Radiant</MenuItem>
          <MenuItem value="psychic">Psychic</MenuItem>
          <MenuItem value="force">Force</MenuItem>
        </Select>
        
        <TextField
          label="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g., Goblin's sword"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Apply Damage
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### 14.3 Event Log Component

```typescript
// EventLog.tsx
export function EventLog({ sessionId }: { sessionId: string }) {
  const { events } = useGameSession(sessionId);
  
  const getEventIcon = (eventType: GameEventType) => {
    switch (eventType) {
      case 'DAMAGE_TAKEN': return '⚔️';
      case 'HEALING_RECEIVED': return '💚';
      case 'SPELL_CAST': return '✨';
      case 'ATTACK_ROLL': return '🎲';
      case 'DEATH_SAVE': return '💀';
      default: return '📝';
    }
  };
  
  const formatEventMessage = (event: GameEvent) => {
    switch (event.eventType) {
      case 'DAMAGE_TAKEN':
        return `${event.targetName} took ${event.result.effectiveDamage} ${event.eventData.damageType} damage`;
      case 'HEALING_RECEIVED':
        return `${event.targetName} healed ${event.result.actualHealing} HP`;
      case 'SPELL_CAST':
        return `${event.actorName} cast ${event.eventData.spellName}`;
      case 'ATTACK_ROLL':
        return `${event.actorName} rolled ${event.result.total} to hit`;
      default:
        return `${event.eventType}`;
    }
  };
  
  return (
    <div className="event-log">
      <h3>Event Log</h3>
      <div className="events">
        {events.map((event) => (
          <div key={event.id} className="event-item">
            <span className="event-icon">
              {getEventIcon(event.eventType)}
            </span>
            <span className="event-message">
              {formatEventMessage(event)}
            </span>
            <span className="event-time">
              {formatTime(event.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 14.4 Dice Roller Component

```typescript
// DiceRoller.tsx
export function DiceRoller({ 
  characterId, 
  sessionId 
}: DiceRollerProps) {
  const { rollDice } = useGameSession(sessionId);
  const [rollType, setRollType] = useState<'ability' | 'save' | 'attack'>('ability');
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [lastRoll, setLastRoll] = useState<any>(null);
  
  const handleRoll = async () => {
    const result = await rollDice(characterId, rollType, {
      advantage,
      disadvantage
    });
    setLastRoll(result);
  };
  
  return (
    <div className="dice-roller">
      <Select value={rollType} onChange={(e) => setRollType(e.target.value)}>
        <MenuItem value="ability">Ability Check</MenuItem>
        <MenuItem value="save">Saving Throw</MenuItem>
        <MenuItem value="attack">Attack Roll</MenuItem>
      </Select>
      
      <FormControlLabel
        control={
          <Checkbox 
            checked={advantage}
            onChange={(e) => setAdvantage(e.target.checked)}
          />
        }
        label="Advantage"
      />
      
      <FormControlLabel
        control={
          <Checkbox 
            checked={disadvantage}
            onChange={(e) => setDisadvantage(e.target.checked)}
          />
        }
        label="Disadvantage"
      />
      
      <Button onClick={handleRoll} variant="contained">
        Roll
      </Button>
      
      {lastRoll && (
        <div className="roll-result">
          <div className="dice-animation">🎲</div>
          <div className="roll-details">
            <span className="roll-value">{lastRoll.result.total}</span>
            <span className="roll-breakdown">
              ({lastRoll.result.usedRoll} + {lastRoll.result.modifier})
            </span>
            {lastRoll.result.criticalSuccess && (
              <span className="critical">Critical Success!</span>
            )}
            {lastRoll.result.criticalFailure && (
              <span className="critical-fail">Critical Failure!</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 15. Performance Considerations

### 15.1 Database Indexing

```typescript
// Indici consigliati per performance ottimale

// GameEvent collection
db.game_events.createIndex({ sessionId: 1, timestamp: -1 });
db.game_events.createIndex({ campaignId: 1, timestamp: -1 });
db.game_events.createIndex({ actorId: 1, timestamp: -1 });
db.game_events.createIndex({ targetId: 1, timestamp: -1 });
db.game_events.createIndex({ eventType: 1, sessionId: 1 });

// GameSession collection
db.game_sessions.createIndex({ campaignId: 1, sessionDate: -1 });
db.game_sessions.createIndex({ status: 1, startTime: -1 });

// CombatEncounter collection
db.combat_encounters.createIndex({ sessionId: 1, status: 1 });
db.combat_encounters.createIndex({ campaignId: 1, startTime: -1 });
```

### 15.2 Caching Strategy

```typescript
class EventCacheService {
  private cache: Map<string, GameEvent[]> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minuti
  
  async getSessionEvents(sessionId: string): Promise<GameEvent[]> {
    const cacheKey = `session:${sessionId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const events = await this.eventRepo.find({ sessionId });
    this.cache.set(cacheKey, events);
    
    // Auto-invalidate dopo TTL
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, this.CACHE_TTL);
    
    return events;
  }
  
  invalidateSession(sessionId: string): void {
    this.cache.delete(`session:${sessionId}`);
  }
}
```

### 15.3 WebSocket Optimization

```typescript
// Batch updates per ridurre traffico
class WebSocketBatchService {
  private batchQueue: Map<string, any[]> = new Map();
  private readonly BATCH_INTERVAL = 100; // ms
  
  constructor(private wsService: WebSocketService) {
    setInterval(() => this.flushBatches(), this.BATCH_INTERVAL);
  }
  
  queueUpdate(sessionId: string, update: any): void {
    if (!this.batchQueue.has(sessionId)) {
      this.batchQueue.set(sessionId, []);
    }
    this.batchQueue.get(sessionId)!.push(update);
  }
  
  private flushBatches(): void {
    for (const [sessionId, updates] of this.batchQueue.entries()) {
      if (updates.length > 0) {
        this.wsService.broadcastToSession(sessionId, {
          type: 'BATCH_UPDATE',
          updates
        });
        this.batchQueue.set(sessionId, []);
      }
    }
  }
}
```

---

## 16. Security Considerations

### 16.1 Authorization Checks

```typescript
class EventAuthorizationService {
  async canPerformAction(
    userId: string,
    sessionId: string,
    action: string
  ): Promise<boolean> {
    const session = await this.sessionRepo.findById(sessionId);
    const campaign = await this.campaignRepo.findById(session.campaignId);
    
    // DM può fare tutto
    if (session.masterUserId === userId) {
      return true;
    }
    
    // Player può agire solo sul proprio character
    const userCharacters = await this.characterRepo.find({
      userId,
      campaignId: campaign.id
    });
    
    const characterIds = userCharacters.map(c => c.id);
    
    // Verifica che l'azione sia sul proprio character
    return characterIds.length > 0;
  }
}
```

### 16.2 Input Validation

```typescript
class EventValidationService {
  validateDamageInput(damage: number, damageType: string): void {
    if (damage < 0) {
      throw new ValidationError('Damage cannot be negative');
    }
    
    if (damage > 1000) {
      throw new ValidationError('Damage exceeds maximum allowed');
    }
    
    const validDamageTypes = [
      'slashing', 'piercing', 'bludgeoning',
      'fire', 'cold', 'lightning', 'thunder',
      'acid', 'poison', 'necrotic', 'radiant',
      'psychic', 'force'
    ];
    
    if (!validDamageTypes.includes(damageType)) {
      throw new ValidationError('Invalid damage type');
    }
  }
  
  validateSpellSlot(level: number): void {
    if (level < 1 || level > 9) {
      throw new ValidationError('Spell level must be between 1 and 9');
    }
  }
}
```

---

## 17. Testing Strategy

### 17.1 Unit Tests

```typescript
describe('DamageService', () => {
  it('should apply damage correctly', async () => {
    const character = createMockCharacter({
      currentHitPoints: 45,
      temporaryHitPoints: 5,
      maxHitPoints: 45
    });
    
    const event = await damageService.applyDamage(
      character.id,
      10,
      'slashing',
      'test',
      'session123'
    );
    
    expect(event.result.effectiveDamage).toBe(10);
    expect(event.result.tempHpLost).toBe(5);
    expect(event.result.hpLost).toBe(5);
    expect(character.currentHitPoints).toBe(40);
    expect(character.temporaryHitPoints).toBe(0);
  });
  
  it('should apply resistance correctly', async () => {
    const character = createMockCharacter({
      currentHitPoints: 45,
      damageResistances: ['fire']
    });
    
    const event = await damageService.applyDamage(
      character.id,
      20,
      'fire',
      'test',
      'session123'
    );
    
    expect(event.result.effectiveDamage).toBe(10);
  });
});
```

### 17.2 Integration Tests

```typescript
describe('Combat Flow', () => {
  it('should handle full combat sequence', async () => {
    // Start combat
    const combat = await combatService.startCombat('session123', [
      { name: 'PC1', initiative: 20, ... },
      { name: 'Monster', initiative: 15, ... }
    ]);
    
    expect(combat.currentRound).toBe(1);
    expect(combat.participants[0].isActive).toBe(true);
    
    // Apply damage
    await damageService.applyDamage(
      combat.participants[1].characterId,
      10,
      'slashing',
      'PC1 attack',
      'session123'
    );
    
    // Next turn
    const updatedCombat = await combatService.nextTurn(combat.id);
    expect(updatedCombat.participants[1].isActive).toBe(true);
    
    // End combat
    await combatService.endCombat(combat.id);
    const session = await sessionRepo.findById('session123');
    expect(session.currentCombatId).toBeUndefined();
  });
});
```

---

## 18. Monitoring e Logging

### 18.1 Event Metrics

```typescript
class EventMetricsService {
  async trackEventMetrics(event: GameEvent): Promise<void> {
    await this.metricsRepo.increment(`events.${event.eventType}`);
    await this.metricsRepo.increment(`events.session.${event.sessionId}`);
    
    if (event.eventType === 'DAMAGE_TAKEN') {
      await this.metricsRepo.histogram(
        'damage.amount',
        event.result.effectiveDamage
      );
    }
  }
  
  async getSessionStats(sessionId: string): Promise<SessionStats> {
    const events = await this.eventRepo.find({ sessionId });
    
    return {
      totalEvents: events.length,
      damageDealt: events
        .filter(e => e.eventType === 'DAMAGE_TAKEN')
        .reduce((sum, e) => sum + e.result.effectiveDamage, 0),
      healingDone: events
        .filter(e => e.eventType === 'HEALING_RECEIVED')
        .reduce((sum, e) => sum + e.result.actualHealing, 0),
      spellsCast: events.filter(e => e.eventType === 'SPELL_CAST').length,
      combatsCompleted: events.filter(e => e.eventType === 'COMBAT_ENDED').length
    };
  }
}
```

---

## Conclusione

Questo sistema di gestione eventi fornisce una soluzione completa per tracciare e gestire tutte le azioni che avvengono durante una sessione di D&D 5E. Le caratteristiche principali includono:

✅ **Event Sourcing completo** - Ogni azione è registrata come evento immutabile
✅ **Real-time Sync** - Aggiornamenti istantanei via WebSocket a tutti i partecipanti
✅ **Validazione automatica** - Regole D&D 5E applicate automaticamente
✅ **Combat Tracker** - Gestione completa dell'iniziativa e dei turni
✅ **Resource Management** - Tracking automatico di HP, spell slots, features
✅ **Audit Trail** - Storia completa con possibilità di rollback
✅ **Performance ottimizzata** - Caching, batching, indexing
✅ **Sicurezza** - Authorization e validation su tutti gli endpoint

Il sistema è progettato per scalare e supportare campagne con molti giocatori e sessioni lunghe, mantenendo sempre la sincronizzazione in tempo reale e la consistenza dei dati.