# Campaign Management System - Sistema Gestione Campagne D&D

## Overview

Sistema completo per gestire campagne D&D con Master e Giocatori, dove il Master controlla i manuali disponibili e tutti i giocatori della campagna utilizzano lo stesso set di regole.

---

## Table of Contents

1. [Architettura Campagne](#architettura-campagne)
2. [Database Schema](#database-schema)
3. [Ruoli e Permessi](#ruoli-e-permessi)
4. [Gestione Manuali di Campagna](#gestione-manuali-di-campagna)
5. [Validazione e Conformità](#validazione-e-conformità)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Flussi Operativi](#flussi-operativi)

---

## 1. Architettura Campagne

### 1.1 Gerarchia

```
Campaign (Campagna)
├── Masters (1+ utenti con ruolo Master)
├── Players (N utenti con ruolo Player)
├── Campaign Sources (Manuali e Script Custom)
├── Campaign Settings (Configurazione regole)
└── Character Sheets (Schede dei giocatori)
```

### 1.2 Principi Fondamentali

✅ **Master Authority**: Master controlla manuali e regole
✅ **Unified Rules**: Tutti i giocatori usano stesso set di regole
✅ **Inheritance**: Character sheets ereditano configurazione campagna
✅ **Validation**: Modifiche manuali triggera validazione su tutte le schede
✅ **Isolation**: Campagne sono isolate tra loro

---

## 2. Database Schema

### 2.1 Schema Prisma Completo

```prisma
// ============================================
// CAMPAIGN MANAGEMENT
// ============================================

model Campaign {
  id              String    @id @default(uuid())
  name            String
  description     String?
  
  // Master che ha creato la campagna
  createdById     String
  createdBy       User      @relation("CampaignCreator", fields: [createdById], references: [id])
  
  // Impostazioni campagna
  settings        Json      // Regole homebrew, varianti, etc.
  
  // Configurazione sorgenti (manuali)
  sourcesConfig   Json      // CurrentSources structure
  
  // Script custom della campagna
  customScripts   Json?     // Custom .js scripts
  
  // Stato campagna
  status          CampaignStatus @default(ACTIVE)
  
  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relazioni
  members         CampaignMember[]
  characterSheets CharacterSheet[]
  customContent   CampaignCustomContent[]
  invitations     CampaignInvitation[]
  
  @@map("campaigns")
  @@index([createdById])
  @@index([status])
}

enum CampaignStatus {
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

// ============================================
// CAMPAIGN MEMBERSHIP
// ============================================

model CampaignMember {
  id              String    @id @default(uuid())
  
  campaignId      String
  campaign        Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  role            CampaignRole
  
  // Permessi specifici (opzionale)
  permissions     Json?     // {canEditSettings: false, canInvitePlayers: true, ...}
  
  // Metadata
  joinedAt        DateTime  @default(now())
  lastActiveAt    DateTime  @default(now())
  
  @@unique([campaignId, userId])
  @@map("campaign_members")
  @@index([campaignId])
  @@index([userId])
}

enum CampaignRole {
  MASTER          // Può modificare tutto
  CO_MASTER       // Può modificare quasi tutto (opzionale)
  PLAYER          // Può solo creare/modificare proprie schede
  OBSERVER        // Può solo visualizzare (opzionale)
}

// ============================================
// CAMPAIGN INVITATIONS
// ============================================

model CampaignInvitation {
  id              String    @id @default(uuid())
  
  campaignId      String
  campaign        Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  // Invito via email o username
  invitedEmail    String?
  invitedUsername String?
  
  invitedById     String
  invitedBy       User      @relation(fields: [invitedById], references: [id])
  
  role            CampaignRole @default(PLAYER)
  
  // Token per accettazione
  token           String    @unique
  
  status          InvitationStatus @default(PENDING)
  
  expiresAt       DateTime
  acceptedAt      DateTime?
  
  createdAt       DateTime  @default(now())
  
  @@map("campaign_invitations")
  @@index([campaignId])
  @@index([token])
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

// ============================================
// CAMPAIGN CUSTOM CONTENT
// ============================================

model CampaignCustomContent {
  id              String    @id @default(uuid())
  
  campaignId      String
  campaign        Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  type            CustomContentType
  key             String    // Unique identifier (e.g., "gunslinger", "myrace")
  name            String
  source          String    // Source abbreviation
  
  data            Json      // Complete content data
  
  // Chi ha aggiunto questo contenuto
  addedById       String
  addedBy         User      @relation(fields: [addedById], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([campaignId, type, key])
  @@map("campaign_custom_content")
  @@index([campaignId])
  @@index([type])
}

enum CustomContentType {
  RACE
  CLASS
  SUBCLASS
  SPELL
  FEAT
  MAGIC_ITEM
  WEAPON
  ARMOR
  BACKGROUND
}

// ============================================
// CHARACTER SHEET (Updated)
// ============================================

model CharacterSheet {
  id              String    @id @default(uuid())
  
  // Owner
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Campaign (opzionale - schede possono esistere fuori campagne)
  campaignId      String?
  campaign        Campaign? @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  
  // Basic Information
  characterName   String
  playerName      String?
  race            String?
  raceVariant     String?
  background      String?
  alignment       String?
  experiencePoints Int      @default(0)
  
  // Core Stats
  level           Int       @default(1)
  proficiencyBonus Int      @default(2)
  
  // Ability Scores (stored as JSON for flexibility)
  abilityScores   Json      // CurrentStats structure
  
  // Classes (stored as JSON array)
  classes         Json      // Array of {classKey, subclassKey, level, name}
  
  // ... (tutti gli altri campi come prima)
  
  // Validation Status (per campagne)
  validationStatus ValidationStatus @default(VALID)
  validationErrors Json?     // Array of validation errors
  lastValidatedAt  DateTime?
  
  // Settings and Preferences
  settings        Json      // User preferences for this sheet
  
  // Custom Content (se NON in campagna)
  customScripts   Json?     // User-imported custom scripts (solo se campaignId = null)
  
  // Source Configuration (se NON in campagna)
  sourcesConfig   Json?     // CurrentSources structure (solo se campaignId = null)
  
  // Metadata
  version         String    @default("1.0.0")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  companions      Companion[]
  
  @@map("character_sheets")
  @@index([userId])
  @@index([campaignId])
  @@index([validationStatus])
}

enum ValidationStatus {
  VALID           // Scheda conforme alle regole campagna
  INVALID         // Scheda non conforme (deve essere corretta)
  PENDING         // Validazione in corso
  WARNING         // Conforme ma con avvisi
}

// ============================================
// USER (Updated)
// ============================================

model User {
  id            String          @id @default(uuid())
  email         String          @unique
  username      String          @unique
  passwordHash  String
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  // Relazioni
  characterSheets     CharacterSheet[]
  campaignsCreated    Campaign[]              @relation("CampaignCreator")
  campaignMemberships CampaignMember[]
  campaignInvitations CampaignInvitation[]
  customContentAdded  CampaignCustomContent[]
  
  @@map("users")
}
```

---

## 3. Ruoli e Permessi

### 3.1 Matrice Permessi

| Azione | MASTER | CO_MASTER | PLAYER | OBSERVER |
|--------|--------|-----------|--------|----------|
| Modificare manuali campagna | ✅ | ✅ | ❌ | ❌ |
| Aggiungere script custom | ✅ | ✅ | ❌ | ❌ |
| Modificare impostazioni campagna | ✅ | ⚠️ | ❌ | ❌ |
| Invitare giocatori | ✅ | ✅ | ❌ | ❌ |
| Rimuovere giocatori | ✅ | ⚠️ | ❌ | ❌ |
| Creare propria scheda | ✅ | ✅ | ✅ | ❌ |
| Modificare propria scheda | ✅ | ✅ | ✅ | ❌ |
| Visualizzare schede altri | ✅ | ✅ | ⚠️ | ✅ |
| Modificare schede altri | ✅ | ⚠️ | ❌ | ❌ |
| Eliminare campagna | ✅ | ❌ | ❌ | ❌ |

⚠️ = Configurabile tramite permissions JSON

### 3.2 Implementazione Permessi

```typescript
// services/campaignPermissionService.ts

export class CampaignPermissionService {
  /**
   * Verifica se utente ha permesso per azione
   */
  async hasPermission(
    userId: string,
    campaignId: string,
    action: CampaignAction
  ): Promise<boolean> {
    const member = await this.getCampaignMember(userId, campaignId);
    
    if (!member) return false;
    
    // Master ha tutti i permessi
    if (member.role === 'MASTER') return true;
    
    // Verifica permessi per ruolo
    const rolePermissions = this.getRolePermissions(member.role);
    
    // Verifica permessi custom (se presenti)
    if (member.permissions) {
      const customPermission = member.permissions[action];
      if (customPermission !== undefined) {
        return customPermission;
      }
    }
    
    return rolePermissions.includes(action);
  }
  
  /**
   * Verifica se utente può modificare scheda
   */
  async canEditCharacterSheet(
    userId: string,
    characterSheetId: string
  ): Promise<boolean> {
    const sheet = await this.getCharacterSheet(characterSheetId);
    
    // Proprietario può sempre modificare
    if (sheet.userId === userId) return true;
    
    // Se scheda in campagna, verifica permessi campagna
    if (sheet.campaignId) {
      return await this.hasPermission(
        userId,
        sheet.campaignId,
        'EDIT_OTHER_SHEETS'
      );
    }
    
    return false;
  }
  
  private getRolePermissions(role: CampaignRole): CampaignAction[] {
    const permissions: Record<CampaignRole, CampaignAction[]> = {
      MASTER: [
        'EDIT_CAMPAIGN_SETTINGS',
        'EDIT_CAMPAIGN_SOURCES',
        'ADD_CUSTOM_SCRIPTS',
        'INVITE_PLAYERS',
        'REMOVE_PLAYERS',
        'CREATE_CHARACTER',
        'EDIT_OWN_CHARACTER',
        'VIEW_OTHER_CHARACTERS',
        'EDIT_OTHER_CHARACTERS',
        'DELETE_CAMPAIGN'
      ],
      CO_MASTER: [
        'EDIT_CAMPAIGN_SOURCES',
        'ADD_CUSTOM_SCRIPTS',
        'INVITE_PLAYERS',
        'CREATE_CHARACTER',
        'EDIT_OWN_CHARACTER',
        'VIEW_OTHER_CHARACTERS'
      ],
      PLAYER: [
        'CREATE_CHARACTER',
        'EDIT_OWN_CHARACTER'
      ],
      OBSERVER: [
        'VIEW_OTHER_CHARACTERS'
      ]
    };
    
    return permissions[role] || [];
  }
}

type CampaignAction = 
  | 'EDIT_CAMPAIGN_SETTINGS'
  | 'EDIT_CAMPAIGN_SOURCES'
  | 'ADD_CUSTOM_SCRIPTS'
  | 'INVITE_PLAYERS'
  | 'REMOVE_PLAYERS'
  | 'CREATE_CHARACTER'
  | 'EDIT_OWN_CHARACTER'
  | 'VIEW_OTHER_CHARACTERS'
  | 'EDIT_OTHER_CHARACTERS'
  | 'DELETE_CAMPAIGN';
```

---

## 4. Gestione Manuali di Campagna

### 4.1 Configurazione Sorgenti Campagna

```typescript
// services/campaignSourcesService.ts

export class CampaignSourcesService {
  /**
   * Aggiorna manuali disponibili nella campagna
   */
  async updateCampaignSources(
    campaignId: string,
    userId: string,
    sourcesConfig: SourcesConfiguration
  ): Promise<UpdateResult> {
    // 1. Verifica permessi
    const hasPermission = await this.permissionService.hasPermission(
      userId,
      campaignId,
      'EDIT_CAMPAIGN_SOURCES'
    );
    
    if (!hasPermission) {
      throw new ForbiddenError('No permission to edit campaign sources');
    }
    
    // 2. Valida configurazione
    const validationResult = await this.validateSourcesConfig(sourcesConfig);
    if (!validationResult.valid) {
      throw new ValidationError(validationResult.errors);
    }
    
    // 3. Aggiorna campagna
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sourcesConfig,
        updatedAt: new Date()
      }
    });
    
    // 4. TRIGGER VALIDAZIONE SU TUTTE LE SCHEDE
    await this.validateAllCampaignCharacters(campaignId);
    
    return {
      success: true,
      charactersValidated: await this.getCampaignCharacterCount(campaignId)
    };
  }
  
  /**
   * Aggiunge script custom alla campagna
   */
  async addCampaignCustomScript(
    campaignId: string,
    userId: string,
    filename: string,
    content: string
  ): Promise<ImportResult> {
    // 1. Verifica permessi
    const hasPermission = await this.permissionService.hasPermission(
      userId,
      campaignId,
      'ADD_CUSTOM_SCRIPTS'
    );
    
    if (!hasPermission) {
      throw new ForbiddenError('No permission to add custom scripts');
    }
    
    // 2. Valida e processa script
    const extractedData = await this.customScriptService.processScript(
      filename,
      content
    );
    
    // 3. Salva contenuto custom nella campagna
    await this.saveCampaignCustomContent(
      campaignId,
      userId,
      extractedData
    );
    
    // 4. Aggiorna customScripts della campagna
    await this.updateCampaignScripts(campaignId, filename, content);
    
    // 5. TRIGGER VALIDAZIONE SU TUTTE LE SCHEDE
    await this.validateAllCampaignCharacters(campaignId);
    
    return {
      success: true,
      itemsAdded: extractedData.summary,
      charactersAffected: await this.getCampaignCharacterCount(campaignId)
    };
  }
  
  /**
   * Rimuove script custom dalla campagna
   */
  async removeCampaignCustomScript(
    campaignId: string,
    userId: string,
    filename: string
  ): Promise<RemoveResult> {
    // 1. Verifica permessi
    const hasPermission = await this.permissionService.hasPermission(
      userId,
      campaignId,
      'ADD_CUSTOM_SCRIPTS'
    );
    
    if (!hasPermission) {
      throw new ForbiddenError('No permission to remove custom scripts');
    }
    
    // 2. Verifica se contenuto è usato in qualche scheda
    const usageCheck = await this.checkScriptUsageInCampaign(
      campaignId,
      filename
    );
    
    if (usageCheck.isUsed) {
      throw new ConflictError(
        `Cannot remove script: used in ${usageCheck.characterCount} character sheets`,
        usageCheck.affectedCharacters
      );
    }
    
    // 3. Rimuovi contenuto custom
    await this.removeCampaignCustomContent(campaignId, filename);
    
    // 4. Aggiorna customScripts della campagna
    await this.removeCampaignScript(campaignId, filename);
    
    return {
      success: true,
      message: 'Script removed successfully'
    };
  }
  
  /**
   * Salva contenuto custom estratto da script
   */
  private async saveCampaignCustomContent(
    campaignId: string,
    userId: string,
    extractedData: ExtractedData
  ): Promise<void> {
    // Salva razze
    for (const [key, race] of Object.entries(extractedData.races)) {
      await this.prisma.campaignCustomContent.upsert({
        where: {
          campaignId_type_key: {
            campaignId,
            type: 'RACE',
            key
          }
        },
        create: {
          campaignId,
          type: 'RACE',
          key,
          name: race.name,
          source: race.source?.[0] || 'Custom',
          data: race,
          addedById: userId
        },
        update: {
          name: race.name,
          source: race.source?.[0] || 'Custom',
          data: race,
          updatedAt: new Date()
        }
      });
    }
    
    // Salva classi
    for (const [key, classData] of Object.entries(extractedData.classes)) {
      await this.prisma.campaignCustomContent.upsert({
        where: {
          campaignId_type_key: {
            campaignId,
            type: 'CLASS',
            key
          }
        },
        create: {
          campaignId,
          type: 'CLASS',
          key,
          name: classData.name,
          source: classData.source?.[0] || 'Custom',
          data: classData,
          addedById: userId
        },
        update: {
          name: classData.name,
          source: classData.source?.[0] || 'Custom',
          data: classData,
          updatedAt: new Date()
        }
      });
    }
    
    // Continua per spell, feats, magic items, etc.
  }
}
```

---

## 5. Validazione e Conformità

### 5.1 Sistema di Validazione

```typescript
// services/campaignValidationService.ts

export class CampaignValidationService {
  /**
   * Valida tutte le schede della campagna
   */
  async validateAllCampaignCharacters(campaignId: string): Promise<ValidationSummary> {
    const campaign = await this.getCampaign(campaignId);
    const characterSheets = await this.getCampaignCharacters(campaignId);
    
    const results: ValidationResult[] = [];
    
    for (const sheet of characterSheets) {
      const result = await this.validateCharacterSheet(
        sheet,
        campaign.sourcesConfig,
        campaignId
      );
      
      // Aggiorna stato validazione scheda
      await this.updateCharacterValidationStatus(sheet.id, result);
      
      results.push(result);
    }
    
    return {
      total: characterSheets.length,
      valid: results.filter(r => r.status === 'VALID').length,
      invalid: results.filter(r => r.status === 'INVALID').length,
      warnings: results.filter(r => r.status === 'WARNING').length,
      details: results
    };
  }
  
  /**
   * Valida singola scheda contro regole campagna
   */
  async validateCharacterSheet(
    sheet: CharacterSheet,
    campaignSources: SourcesConfiguration,
    campaignId: string
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // 1. Valida razza
    if (sheet.race) {
      const raceValidation = await this.validateRace(
        sheet.race,
        campaignSources,
        campaignId
      );
      
      if (!raceValidation.valid) {
        errors.push({
          field: 'race',
          message: `Race "${sheet.race}" is not available in this campaign`,
          severity: 'ERROR'
        });
      }
    }
    
    // 2. Valida classi
    const classes = sheet.classes as any[];
    for (const classData of classes) {
      const classValidation = await this.validateClass(
        classData.classKey,
        classData.subclassKey,
        campaignSources,
        campaignId
      );
      
      if (!classValidation.valid) {
        errors.push({
          field: 'classes',
          message: `Class "${classData.classKey}" or subclass "${classData.subclassKey}" is not available`,
          severity: 'ERROR'
        });
      }
    }
    
    // 3. Valida feats
    const feats = sheet.feats as any[];
    for (const feat of feats) {
      const featValidation = await this.validateFeat(
        feat.key,
        campaignSources,
        campaignId
      );
      
      if (!featValidation.valid) {
        errors.push({
          field: 'feats',
          message: `Feat "${feat.key}" is not available in this campaign`,
          severity: 'ERROR'
        });
      }
    }
    
    // 4. Valida spell
    const spells = sheet.spellsKnown as string[];
    for (const spellKey of spells || []) {
      const spellValidation = await this.validateSpell(
        spellKey,
        campaignSources,
        campaignId
      );
      
      if (!spellValidation.valid) {
        errors.push({
          field: 'spells',
          message: `Spell "${spellKey}" is not available in this campaign`,
          severity: 'ERROR'
        });
      }
    }
    
    // 5. Valida equipment e magic items
    const equipment = sheet.equipment as any;
    // ... validazione equipment
    
    // Determina stato finale
    let status: ValidationStatus;
    if (errors.length > 0) {
      status = 'INVALID';
    } else if (warnings.length > 0) {
      status = 'WARNING';
    } else {
      status = 'VALID';
    }
    
    return {
      characterSheetId: sheet.id,
      characterName: sheet.characterName,
      status,
      errors,
      warnings,
      validatedAt: new Date()
    };
  }
  
  /**
   * Verifica se razza è disponibile nella campagna
   */
  private async validateRace(
    raceKey: string,
    campaignSources: SourcesConfiguration,
    campaignId: string
  ): Promise<{ valid: boolean; reason?: string }> {
    // 1. Verifica se è razza ufficiale
    const officialRace = await this.prisma.referenceRace.findUnique({
      where: { key: raceKey }
    });
    
    if (officialRace) {
      // Verifica se source è escluso
      const sourceExcluded = campaignSources.globalExcl.includes(
        officialRace.source
      );
      
      if (sourceExcluded) {
        return {
          valid: false,
          reason: `Source "${officialRace.source}" is excluded in this campaign`
        };
      }
      
      // Verifica se razza è esplicitamente esclusa
      const raceExcluded = campaignSources.racesExcl?.includes(raceKey);
      
      if (raceExcluded) {
        return {
          valid: false,
          reason: 'Race is explicitly excluded in this campaign'
        };
      }
      
      return { valid: true };
    }
    
    // 2. Verifica se è razza custom della campagna
    const customRace = await this.prisma.campaignCustomContent.findUnique({
      where: {
        campaignId_type_key: {
          campaignId,
          type: 'RACE',
          key: raceKey
        }
      }
    });
    
    if (customRace) {
      return { valid: true };
    }
    
    return {
      valid: false,
      reason: 'Race not found in campaign sources'
    };
  }
  
  // Metodi simili per validateClass, validateFeat, validateSpell, etc.
}
```

### 5.2 Notifiche Validazione

```typescript
// services/campaignNotificationService.ts

export class CampaignNotificationService {
  /**
   * Notifica giocatori quando manuali cambiano
   */
  async notifySourcesChanged(
    campaignId: string,
    changedBy: string,
    validationSummary: ValidationSummary
  ): Promise<void> {
    const campaign = await this.getCampaign(campaignId);
    const members = await this.getCampaignMembers(campaignId);
    
    // Notifica solo giocatori con schede invalide
    const invalidSheets = validationSummary.details.filter(
      d => d.status === 'INVALID'
    );
    
    for (const sheet of invalidSheets) {
      const owner = members.find(m => m.userId === sheet.userId);
      
      if (owner) {
        await this.sendNotification(owner.userId, {
          type: 'CAMPAIGN_SOURCES_CHANGED',
          campaignId,
          campaignName: campaign.name,
          message: `Campaign sources have been updated. Your character "${sheet.characterName}" needs to be reviewed.`,
          errors: sheet.errors,
          actionRequired: true
        });
      }
    }
  }
}
```

---

## 6. API Endpoints

### 6.1 Campaign Management

```typescript
// routes/campaigns.ts

// Crea nuova campagna
POST /api/campaigns
Body: {
  name: string;
  description?: string;
  settings?: Json;
  sourcesConfig?: SourcesConfiguration;
}

// Lista campagne utente (come master o player)
GET /api/campaigns
Query: ?role=master|player|all

// Dettagli campagna
GET /api/campaigns/:id

// Aggiorna campagna
PUT /api/campaigns/:id
Body: {
  name?: string;
  description?: string;
  settings?: Json;
  status?: CampaignStatus;
}

// Elimina campagna
DELETE /api/campaigns/:id

// ============================================
// MEMBERS
// ============================================

// Lista membri campagna
GET /api/campaigns/:id/members

// Invita giocatore
POST /api/campaigns/:id/invitations
Body: {
  email?: string;
  username?: string;
  role: CampaignRole;
}

// Accetta invito
POST /api/campaigns/invitations/:token/accept

// Rifiuta invito
POST /api/campaigns/invitations/:token/decline

// Rimuovi membro
DELETE /api/campaigns/:id/members/:userId

// Aggiorna ruolo membro
PUT /api/campaigns/:id/members/:userId
Body: {
  role: CampaignRole;
  permissions?: Json;
}

// ============================================
// SOURCES
// ============================================

// Aggiorna manuali campagna
PUT /api/campaigns/:id/sources
Body: {
  sourcesConfig: SourcesConfiguration;
}

// Aggiungi script custom
POST /api/campaigns/:id/custom-scripts
Body: FormData with .js file

// Rimuovi script custom
DELETE /api/campaigns/:id/custom-scripts/:filename

// Lista contenuto custom campagna
GET /api/campaigns/:id/custom-content
Query: ?type=race|class|spell|feat|magic_item

// ============================================
// VALIDATION
// ============================================

// Valida tutte le schede campagna
POST /api/campaigns/:id/validate

// Ottieni stato validazione
GET /api/campaigns/:id/validation-status

// ============================================
// CHARACTER SHEETS
// ============================================

// Lista schede campagna
GET /api/campaigns/:id/character-sheets

// Crea scheda in campagna
POST /api/campaigns/:id/character-sheets
Body: {
  characterName: string;
  // ... altri campi
}
```

---

## 7. Frontend Components

### 7.1 Campaign Dashboard

```typescript
// components/CampaignDashboard.tsx

export const CampaignDashboard: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const { campaign, members, characterSheets } = useCampaign(campaignId);
  const { user } = useAuth();
  
  const isMaster = members.find(m => m.userId === user.id)?.role === 'MASTER';
  
  return (
    <div className="campaign-dashboard">
      <CampaignHeader campaign={campaign} />
      
      {isMaster && (
        <div className="master-controls">
          <CampaignSourcesManager campaignId={campaignId} />
          <CampaignMembersManager campaignId={campaignId} />
          <CampaignValidationStatus campaignId={campaignId} />
        </div>
      )}
      
      <div className="campaign-characters">
        <h2>Character Sheets</h2>
        <CharacterSheetList
          sheets={characterSheets}
          canEdit={isMaster}
        />
      </div>
      
      <div className="campaign-members">
        <h2>Members</h2>
        <MembersList members={members} />
      </div>
    </div>
  );
};
```

### 7.2 Campaign Sources Manager

```typescript
// components/CampaignSourcesManager.tsx

export const CampaignSourcesManager: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const { campaign, updateSources } = useCampaign(campaignId);
  const [sourcesConfig, setSourcesConfig] = useState(campaign.sourcesConfig);
  
  const handleUpdateSources = async () => {
    const result = await updateSources(sourcesConfig);
    
    if (result.charactersValidated > 0) {
      alert(`Sources updated. ${result.charactersValidated} character sheets validated.`);
    }
  };
  
  return (
    <div className="campaign-sources-manager">
      <h3>Campaign Sources</h3>
      
      <SourcesSelector
        value={sourcesConfig}
        onChange={setSourcesConfig}
      />
      
      <CustomScriptUploader campaignId={campaignId} />
      
      <button onClick={handleUpdateSources}>
        Update Campaign Sources
      </button>
      
      <div className="warning">
        ⚠️ Updating sources will validate all character sheets in this campaign.
        Players will be notified if their characters become invalid.
      </div>
    </div>
  );
};
```

### 7.3 Character Sheet Validation Badge

```typescript
// components/CharacterValidationBadge.tsx

export const CharacterValidationBadge: React.FC<{ sheet: CharacterSheet }> = ({ sheet }) => {
  if (!sheet.campaignId) return null;
  
  const statusConfig = {
    VALID: { color: 'green', icon: '✓', text: 'Valid' },
    INVALID: { color: 'red', icon: '✗', text: 'Invalid' },
    WARNING: { color: 'yellow', icon: '⚠', text: 'Warning' },
    PENDING: { color: 'gray', icon: '⏳', text: 'Validating...' }
  };
  
  const config = statusConfig[sheet.validationStatus];
  
  return (
    <div className={`validation-badge ${config.color}`}>
      <span className="icon">{config.icon}</span>
      <span className="text">{config.text}</span>
      
      {sheet.validationErrors && (
        <div className="validation-errors">
          {sheet.validationErrors.map((error, i) => (
            <div key={i} className="error-item">
              {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 8. Flussi Operativi

### 8.1 Creazione Campagna

```
1. Master crea campagna
   ↓
2. Configura nome, descrizione, impostazioni
   ↓
3. Seleziona manuali disponibili (sourcesConfig)
   ↓
4. (Opzionale) Carica script custom .js
   ↓
5. Campagna creata con status ACTIVE
   ↓
6. Master può invitare giocatori
```

### 8.2 Giocatore Join Campagna

```
1. Master invia invito (email o username)
   ↓
2. Sistema genera token univoco
   ↓
3. Giocatore riceve email con link
   ↓
4. Giocatore clicca link e accetta invito
   ↓
5. Sistema crea CampaignMember con role PLAYER
   ↓
6. Giocatore può creare character sheet nella campagna
```

### 8.3 Creazione Character Sheet in Campagna

```
1. Giocatore clicca "Create Character" in campagna
   ↓
2. Frontend carica sourcesConfig e customContent della campagna
   ↓
3. Dropdown popolati SOLO con contenuto disponibile in campagna
   ↓
4. Giocatore compila scheda
   ↓
5. Backend valida scheda contro regole campagna
   ↓
6. Se valida: scheda salvata con validationStatus = VALID
   Se invalida: errori mostrati, scheda non salvata
```

### 8.4 Master Modifica Manuali

```
1. Master aggiorna sourcesConfig o aggiunge script custom
   ↓
2. Backend salva nuova configurazione
   ↓
3. Backend triggera validateAllCampaignCharacters()
   ↓
4. Per ogni scheda:
   - Valida razza, classi, feats, spell, equipment
   - Aggiorna validationStatus e validationErrors
   ↓
5. Sistema invia notifiche a giocatori con schede invalide
   ↓
6. Giocatori vedono badge "Invalid" sulle loro schede
   ↓
7. Giocatori devono correggere schede per renderle conformi
```

### 8.5 Giocatore Corregge Scheda Invalida

```
1. Giocatore apre scheda con status INVALID
   ↓
2. Frontend mostra errori di validazione
   ↓
3. Giocatore modifica campi problematici
   ↓
4. Ad ogni salvataggio, backend ri-valida scheda
   ↓
5. Quando tutti gli errori risolti: validationStatus = VALID
   ↓
6. Badge diventa verde ✓
```

---

## 9. Considerazioni Implementative

### 9.1 Performance

**Validazione Asincrona**:
```typescript
// Usa job queue per validazioni massive
await this.jobQueue.add('validate-campaign-characters', {
  campaignId,
  priority: 'high'
});
```

**Caching**:
```typescript
// Cache contenuto custom campagna per 1 ora
const cacheKey = `campaign:${campaignId}:custom-content`;
await this.cache.set(cacheKey, customContent, 3600);
```

### 9.2 Scalabilità

- Validazione in background con job queue
- Notifiche batch per evitare spam
- Paginazione per liste grandi (100+ schede)
- Indici database su campaignId, validationStatus

### 9.3 UX

- **Feedback Immediato**: Mostra errori validazione in tempo reale
- **Notifiche Non Invasive**: Badge + email, non popup
- **Guida Correzione**: Suggerimenti su come risolvere errori
- **Preview Modifiche**: Mostra impatto prima di applicare

---

## Riassunto

✅ **Campagne Multi-Master**: Supporto per più master
✅ **Controllo Centralizzato**: Master gestisce manuali per tutti
✅ **Validazione Automatica**: Trigger su tutte le schede quando manuali cambiano
✅ **Notifiche Intelligenti**: Solo giocatori affetti ricevono notifiche
✅ **Isolamento**: Campagne completamente separate
✅ **Flessibilità**: Script custom per campagna
✅ **Permessi Granulari**: Matrice permessi configurabile
✅ **Conformità Garantita**: Impossibile usare contenuto non disponibile

Il sistema garantisce che tutti i giocatori di una campagna utilizzino esattamente lo stesso set di regole, con validazione automatica e notifiche quando le regole cambiano!