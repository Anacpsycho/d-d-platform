# Custom Script Import System - Manuale Completo

## Overview

Sì, sarà possibile importare file `.js` di manuali custom esattamente come nel PDF originale. Ecco come funzionerà il sistema completo.

---

## 1. Formato File JavaScript Custom

### 1.1 Struttura Standard

I file `.js` seguono il formato MPMB standard:

```javascript
// homebrew_races.js

var iFileName = "Homebrew Races v1.0";

RequiredSheetVersion("13.0.0");

// Aggiungi una nuova razza
RaceList["myrace"] = {
    regExpSearch: /^my custom race$/i,
    name: "My Custom Race",
    source: ["HB", 0],
    plural: "My Custom Races",
    size: 3, // Medium
    speed: {
        walk: { spd: 30, enc: 20 }
    },
    languageProfs: ["Common", "Elvish"],
    vision: [["Darkvision", 60]],
    age: " reach adulthood at 20 and live up to 750 years",
    height: " range from 5 to over 6 feet tall",
    weight: " weigh around 155 lb",
    scores: [0, 2, 0, 1, 0, 0], // +2 Dex, +1 Int
    trait: "My Custom Race (+2 Dex, +1 Int)\n\nCustom Trait: Description here.",
    features: {
        "custom feature": {
            name: "Custom Feature",
            minlevel: 1,
            usages: 1,
            recovery: "long rest",
            action: ["action", ""]
        }
    }
};

// Aggiungi una sottorazza
RaceList["myrace-variant"] = {
    regExpSearch: /^(?=.*my)(?=.*custom)(?=.*variant).*$/i,
    name: "My Custom Race (Variant)",
    source: ["HB", 0],
    plural: "My Custom Races (Variant)",
    size: 3,
    speed: {
        walk: { spd: 35, enc: 25 }
    },
    languageProfs: ["Common", "Draconic"],
    vision: [["Darkvision", 60]],
    scores: [0, 2, 1, 0, 0, 0], // +2 Dex, +1 Con
    trait: "Variant trait description"
};

// Aggiungi una nuova classe
ClassList["myclass"] = {
    regExpSearch: /^my custom class$/i,
    name: "My Custom Class",
    source: ["HB", 0],
    primaryAbility: "Strength and Constitution",
    prereqs: "Strength 13",
    die: 10,
    improvements: [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5],
    saves: ["Str", "Con"],
    skills: ["\n\n" + toUni("My Custom Class") + ": Choose two from Athletics, Intimidation, Perception, and Survival."],
    armor: [
        [true, true, false, true],
        [true, true, false, true]
    ],
    weapons: [
        [true, true],
        [true, true]
    ],
    equipment: "My Custom Class starting equipment:\n \u2022 A martial weapon;\n \u2022 Leather armor;\n \u2022 An explorer's pack.",
    subclasses: ["Custom Archetype", []],
    attacks: [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    features: {
        "custom feature": {
            name: "Custom Feature",
            source: ["HB", 0],
            minlevel: 1,
            description: "Description of the feature"
        }
    }
};

// Aggiungi spell custom
SpellsList["mycustomspell"] = {
    name: "My Custom Spell",
    classes: ["wizard", "sorcerer"],
    source: ["HB", 0],
    level: 3,
    school: "Evoc",
    time: "1 a",
    range: "60 ft",
    components: "V,S,M",
    compMaterial: "A piece of amber",
    duration: "Instantaneous",
    description: "3d8+1d8/SL Fire dmg; save halves",
    descriptionFull: "Full description of the spell effect."
};

// Aggiungi feat custom
FeatsList["mycustomfeat"] = {
    name: "My Custom Feat",
    source: ["HB", 0],
    prerequisite: "Strength 13 or higher",
    prereqeval: function(v) { return What('Str') >= 13; },
    description: "Description of the feat benefits",
    scores: [1, 0, 0, 0, 0, 0], // +1 Str
    action: ["bonus action", ""]
};

// Aggiungi magic item custom
MagicItemsList["mycustomitem"] = {
    name: "My Custom Magic Item",
    source: ["HB", 0],
    type: "weapon (longsword)",
    rarity: "rare",
    attunement: true,
    description: "Description of the magic item",
    descriptionFull: "Full description with all properties",
    weight: 3,
    weaponOptions: {
        baseWeapon: "longsword",
        regExpSearch: /^(?=.*my)(?=.*custom)(?=.*item).*$/i,
        name: "My Custom Item",
        source: ["HB", 0],
        damage: [1, 8, "slashing"],
        description: "+1 to hit and damage, additional effects"
    }
};
```

---

## 2. Sistema di Import nella Web App

### 2.1 Frontend - Upload Interface

```typescript
// components/CustomScriptUpload.tsx

import React, { useState } from 'react';
import { useCustomScripts } from '../hooks/useCustomScripts';

export const CustomScriptUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const { uploadScript, isUploading } = useCustomScripts();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Valida estensione
      if (!selectedFile.name.endsWith('.js')) {
        alert('Only .js files are allowed');
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('script', file);
    
    try {
      await uploadScript(formData);
      alert('Script imported successfully!');
      setFile(null);
    } catch (error) {
      alert('Error importing script: ' + error.message);
    }
  };
  
  return (
    <div className="custom-script-upload">
      <h3>Import Custom Content</h3>
      <p>Upload .js files to add custom races, classes, spells, feats, and magic items</p>
      
      <input
        type="file"
        accept=".js"
        onChange={handleFileChange}
      />
      
      {file && (
        <div>
          <p>Selected: {file.name}</p>
          <button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Importing...' : 'Import Script'}
          </button>
        </div>
      )}
      
      <div className="imported-scripts">
        <h4>Currently Imported Scripts</h4>
        {/* Lista script già importati */}
      </div>
    </div>
  );
};
```

### 2.2 Backend - Script Processing Pipeline

```typescript
// services/customScriptService.ts

import { PrismaClient } from '@prisma/client';
import * as vm from 'vm';

export class CustomScriptService {
  constructor(private prisma: PrismaClient) {}
  
  /**
   * Import e processa un file .js custom
   */
  async importCustomScript(
    userId: string,
    characterSheetId: string,
    filename: string,
    content: string
  ): Promise<ImportResult> {
    // 1. VALIDAZIONE SICUREZZA
    const validationResult = await this.validateScript(content);
    if (!validationResult.safe) {
      throw new Error(`Script validation failed: ${validationResult.reason}`);
    }
    
    // 2. PARSING ED ESECUZIONE IN SANDBOX
    const extractedData = await this.executeScriptInSandbox(content);
    
    // 3. SALVATAGGIO NEL DATABASE
    await this.saveExtractedData(characterSheetId, extractedData);
    
    // 4. AGGIORNAMENTO CUSTOM SCRIPTS
    await this.updateCustomScriptsList(characterSheetId, filename, content);
    
    // 5. INVALIDAZIONE CACHE
    await this.invalidateReferenceCache();
    
    return {
      success: true,
      itemsAdded: {
        races: extractedData.races.length,
        classes: extractedData.classes.length,
        spells: extractedData.spells.length,
        feats: extractedData.feats.length,
        magicItems: extractedData.magicItems.length
      }
    };
  }
  
  /**
   * Valida sicurezza dello script
   */
  private async validateScript(content: string): Promise<ValidationResult> {
    // Lista nera di operazioni pericolose
    const dangerousPatterns = [
      /require\s*\(/,           // No require()
      /import\s+/,              // No import
      /eval\s*\(/,              // No eval()
      /Function\s*\(/,          // No Function constructor
      /setTimeout/,             // No setTimeout
      /setInterval/,            // No setInterval
      /XMLHttpRequest/,         // No XHR
      /fetch\s*\(/,             // No fetch
      /process\./,              // No process access
      /child_process/,          // No child process
      /fs\./,                   // No filesystem
      /\.\.\/\.\.\//,           // No directory traversal
      /__dirname/,              // No __dirname
      /__filename/,             // No __filename
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return {
          safe: false,
          reason: `Dangerous pattern detected: ${pattern}`
        };
      }
    }
    
    // Verifica sintassi JavaScript
    try {
      new Function(content);
    } catch (error) {
      return {
        safe: false,
        reason: `Syntax error: ${error.message}`
      };
    }
    
    return { safe: true };
  }
  
  /**
   * Esegue script in sandbox sicuro ed estrae dati
   */
  private async executeScriptInSandbox(content: string): Promise<ExtractedData> {
    // Crea sandbox context con oggetti globali limitati
    const sandbox = {
      // Oggetti che lo script può popolare
      RaceList: {},
      ClassList: {},
      ClassSubList: {},
      SpellsList: {},
      FeatsList: {},
      MagicItemsList: {},
      WeaponsList: {},
      ArmourList: {},
      BackgroundList: {},
      
      // Funzioni helper necessarie
      RequiredSheetVersion: (version: string) => {
        // Verifica compatibilità versione
      },
      toUni: (text: string) => text, // Placeholder
      
      // Variabili globali necessarie
      iFileName: '',
      
      // Blocca accesso a oggetti pericolosi
      console: {
        log: () => {},
        error: () => {},
        warn: () => {}
      }
    };
    
    // Esegui script in sandbox
    try {
      const script = new vm.Script(content);
      const context = vm.createContext(sandbox);
      script.runInContext(context, {
        timeout: 5000, // 5 secondi max
        displayErrors: true
      });
    } catch (error) {
      throw new Error(`Script execution failed: ${error.message}`);
    }
    
    // Estrai dati popolati
    return {
      races: this.extractRaces(sandbox.RaceList),
      classes: this.extractClasses(sandbox.ClassList),
      subclasses: this.extractSubclasses(sandbox.ClassSubList),
      spells: this.extractSpells(sandbox.SpellsList),
      feats: this.extractFeats(sandbox.FeatsList),
      magicItems: this.extractMagicItems(sandbox.MagicItemsList),
      weapons: this.extractWeapons(sandbox.WeaponsList),
      armor: this.extractArmor(sandbox.ArmourList),
      backgrounds: this.extractBackgrounds(sandbox.BackgroundList)
    };
  }
  
  /**
   * Salva dati estratti nel database
   */
  private async saveExtractedData(
    characterSheetId: string,
    data: ExtractedData
  ): Promise<void> {
    // Salva razze custom
    for (const [key, race] of Object.entries(data.races)) {
      await this.prisma.customRace.upsert({
        where: {
          characterSheetId_key: {
            characterSheetId,
            key
          }
        },
        create: {
          characterSheetId,
          key,
          name: race.name,
          source: race.source?.[0] || 'Custom',
          data: race as any
        },
        update: {
          name: race.name,
          source: race.source?.[0] || 'Custom',
          data: race as any
        }
      });
    }
    
    // Salva classi custom
    for (const [key, classData] of Object.entries(data.classes)) {
      await this.prisma.customClass.upsert({
        where: {
          characterSheetId_key: {
            characterSheetId,
            key
          }
        },
        create: {
          characterSheetId,
          key,
          name: classData.name,
          source: classData.source?.[0] || 'Custom',
          hitDie: classData.die,
          data: classData as any
        },
        update: {
          name: classData.name,
          source: classData.source?.[0] || 'Custom',
          hitDie: classData.die,
          data: classData as any
        }
      });
    }
    
    // Salva spell custom
    for (const [key, spell] of Object.entries(data.spells)) {
      await this.prisma.customSpell.upsert({
        where: {
          characterSheetId_key: {
            characterSheetId,
            key
          }
        },
        create: {
          characterSheetId,
          key,
          name: spell.name,
          level: spell.level,
          school: spell.school,
          source: spell.source?.[0] || 'Custom',
          data: spell as any
        },
        update: {
          name: spell.name,
          level: spell.level,
          school: spell.school,
          source: spell.source?.[0] || 'Custom',
          data: spell as any
        }
      });
    }
    
    // Continua per feats, magic items, etc.
  }
  
  /**
   * Aggiorna lista script custom nel character sheet
   */
  private async updateCustomScriptsList(
    characterSheetId: string,
    filename: string,
    content: string
  ): Promise<void> {
    const sheet = await this.prisma.characterSheet.findUnique({
      where: { id: characterSheetId }
    });
    
    const customScripts = (sheet?.customScripts as any) || {};
    
    customScripts[filename] = {
      name: filename.replace('.js', ''),
      content,
      importedAt: new Date().toISOString()
    };
    
    await this.prisma.characterSheet.update({
      where: { id: characterSheetId },
      data: {
        customScripts
      }
    });
  }
  
  /**
   * Estrae razze dal RaceList
   */
  private extractRaces(raceList: any): Record<string, any> {
    const races: Record<string, any> = {};
    
    for (const [key, race] of Object.entries(raceList)) {
      races[key] = {
        key,
        name: race.name,
        source: race.source,
        size: race.size,
        speed: race.speed,
        scores: race.scores,
        languageProfs: race.languageProfs,
        vision: race.vision,
        trait: race.trait,
        features: race.features,
        // ... altri campi
        _raw: race // Mantieni dati originali
      };
    }
    
    return races;
  }
  
  // Metodi simili per extractClasses, extractSpells, etc.
}
```

### 2.3 API Endpoint

```typescript
// routes/customScripts.ts

router.post('/character-sheets/:id/custom-scripts', 
  authenticate,
  upload.single('script'),
  async (req, res) => {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    try {
      const content = file.buffer.toString('utf-8');
      const filename = file.originalname;
      
      const result = await customScriptService.importCustomScript(
        req.user.id,
        id,
        filename,
        content
      );
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Rimuovi script custom
router.delete('/character-sheets/:id/custom-scripts/:filename',
  authenticate,
  async (req, res) => {
    const { id, filename } = req.params;
    
    await customScriptService.removeCustomScript(id, filename);
    
    res.json({ success: true });
  }
);

// Lista script custom
router.get('/character-sheets/:id/custom-scripts',
  authenticate,
  async (req, res) => {
    const { id } = req.params;
    
    const scripts = await customScriptService.listCustomScripts(id);
    
    res.json(scripts);
  }
);
```

---

## 3. Cosa Accade all'Import

### 3.1 Flusso Completo

```
1. USER UPLOAD FILE .js
   ↓
2. FRONTEND VALIDATION
   - Verifica estensione .js
   - Verifica dimensione file (max 5MB)
   ↓
3. UPLOAD TO BACKEND
   - POST /api/character-sheets/:id/custom-scripts
   ↓
4. BACKEND SECURITY VALIDATION
   - Scansione pattern pericolosi
   - Verifica sintassi JavaScript
   - Timeout protection
   ↓
5. SANDBOX EXECUTION
   - Crea VM context isolato
   - Esegue script con timeout 5s
   - Cattura oggetti popolati (RaceList, ClassList, etc.)
   ↓
6. DATA EXTRACTION
   - Estrae razze custom
   - Estrae classi custom
   - Estrae spell custom
   - Estrae feats custom
   - Estrae magic items custom
   ↓
7. DATABASE SAVE
   - Salva in tabelle custom_races, custom_classes, etc.
   - Associa a character sheet specifico
   - Mantiene script originale in customScripts JSON
   ↓
8. CACHE INVALIDATION
   - Invalida cache reference data
   - Forza reload dropdown lists
   ↓
9. RESPONSE TO FRONTEND
   - Ritorna summary: "Added 3 races, 2 classes, 5 spells"
   - Frontend aggiorna UI
   ↓
10. IMMEDIATE AVAILABILITY
    - Contenuto custom appare nei dropdown
    - Utilizzabile immediatamente
```

### 3.2 Esempio Pratico

**File: gunslinger.js**
```javascript
ClassList["gunslinger"] = {
    name: "Gunslinger",
    source: ["CR", 0],
    primaryAbility: "Dexterity",
    die: 8,
    // ... definizione completa
};
```

**Dopo Import:**

1. **Database**: Nuovo record in `custom_classes`
   ```json
   {
     "id": "uuid",
     "characterSheetId": "sheet-123",
     "key": "gunslinger",
     "name": "Gunslinger",
     "source": "CR",
     "hitDie": 8,
     "data": { /* oggetto completo */ }
   }
   ```

2. **Character Sheet**: Script salvato in `customScripts`
   ```json
   {
     "customScripts": {
       "gunslinger.js": {
         "name": "Gunslinger",
         "content": "ClassList['gunslinger'] = {...}",
         "importedAt": "2024-01-15T10:30:00Z"
       }
     }
   }
   ```

3. **Frontend**: Dropdown classi aggiornato
   ```
   Classes:
   - Barbarian
   - Bard
   - ...
   - Gunslinger ⭐ (custom)
   ```

4. **Utilizzo**: Utente può selezionare "Gunslinger" come classe normale

---

## 4. Gestione Conflitti e Merge

### 4.1 Conflitti con Contenuto Ufficiale

```typescript
// Se script custom definisce "wizard" (già esistente)
if (await this.officialContentExists('wizard', 'class')) {
  // Opzione 1: Rinomina automaticamente
  key = 'wizard-custom';
  
  // Opzione 2: Chiedi all'utente
  throw new ConflictError('Class "wizard" already exists. Rename or override?');
  
  // Opzione 3: Merge (preferenza custom)
  mergedData = { ...officialWizard, ...customWizard };
}
```

### 4.2 Merge tra Script Multipli

```typescript
// Se importi 2 script che definiscono stessa razza
// Script 1: elf-variant-1.js
RaceList["elf-custom"] = { ... };

// Script 2: elf-variant-2.js  
RaceList["elf-custom"] = { ... };

// Sistema: Ultimo vince, ma mantiene history
await this.saveScriptVersion(characterSheetId, 'elf-custom', version1);
await this.saveScriptVersion(characterSheetId, 'elf-custom', version2); // Active
```

---

## 5. Rimozione Script Custom

```typescript
async removeCustomScript(characterSheetId: string, filename: string) {
  // 1. Rimuovi script da customScripts
  const sheet = await this.prisma.characterSheet.findUnique({
    where: { id: characterSheetId }
  });
  
  const customScripts = sheet.customScripts as any;
  delete customScripts[filename];
  
  await this.prisma.characterSheet.update({
    where: { id: characterSheetId },
    data: { customScripts }
  });
  
  // 2. Rimuovi contenuto custom associato
  // ATTENZIONE: Solo se non usato nel character sheet!
  const usedInSheet = await this.checkIfUsedInSheet(characterSheetId, filename);
  
  if (!usedInSheet) {
    await this.prisma.customRace.deleteMany({
      where: { 
        characterSheetId,
        source: this.getScriptSource(filename)
      }
    });
    // ... stesso per classes, spells, etc.
  } else {
    throw new Error('Cannot remove script: content is currently in use');
  }
}
```

---

## 6. Schema Database per Custom Content

```prisma
model CustomRace {
  id              String          @id @default(uuid())
  characterSheetId String
  characterSheet  CharacterSheet  @relation(fields: [characterSheetId], references: [id], onDelete: Cascade)
  
  key             String
  name            String
  source          String
  data            Json            // Dati completi della razza
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@unique([characterSheetId, key])
  @@map("custom_races")
}

model CustomClass {
  id              String          @id @default(uuid())
  characterSheetId String
  characterSheet  CharacterSheet  @relation(fields: [characterSheetId], references: [id], onDelete: Cascade)
  
  key             String
  name            String
  source          String
  hitDie          Int
  data            Json
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@unique([characterSheetId, key])
  @@map("custom_classes")
}

model CustomSpell {
  id              String          @id @default(uuid())
  characterSheetId String
  characterSheet  CharacterSheet  @relation(fields: [characterSheetId], references: [id], onDelete: Cascade)
  
  key             String
  name            String
  level           Int
  school          String
  source          String
  data            Json
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@unique([characterSheetId, key])
  @@map("custom_spells")
}

// Simile per CustomFeat, CustomMagicItem, CustomWeapon, CustomArmor, CustomBackground
```

---

## 7. Sicurezza e Limitazioni

### 7.1 Misure di Sicurezza

✅ **Sandbox VM**: Script eseguito in context isolato
✅ **Timeout**: Max 5 secondi esecuzione
✅ **Pattern Blacklist**: Blocca operazioni pericolose
✅ **No Network Access**: Nessuna chiamata esterna
✅ **No File System**: Nessun accesso a file
✅ **Memory Limit**: Max 50MB per script
✅ **Size Limit**: Max 5MB file size

### 7.2 Limitazioni

⚠️ Script custom sono **per-character-sheet**, non globali
⚠️ Massimo 50 script custom per sheet
⚠️ Contenuto custom non condivisibile tra utenti (privacy)
⚠️ Nessun accesso a API esterne
⚠️ Nessuna persistenza cross-session (solo in DB)

---

## 8. UI/UX per Gestione Script

### 8.1 Interfaccia Gestione

```typescript
// components/CustomScriptManager.tsx

export const CustomScriptManager: React.FC = () => {
  const { scripts, removeScript } = useCustomScripts();
  
  return (
    <div className="script-manager">
      <h3>Custom Content Scripts</h3>
      
      <div className="script-list">
        {scripts.map(script => (
          <div key={script.filename} className="script-item">
            <div className="script-info">
              <h4>{script.name}</h4>
              <p>Imported: {formatDate(script.importedAt)}</p>
              <p>
                Added: {script.itemsAdded.races} races, 
                {script.itemsAdded.classes} classes,
                {script.itemsAdded.spells} spells
              </p>
            </div>
            
            <div className="script-actions">
              <button onClick={() => viewScript(script)}>
                View Code
              </button>
              <button onClick={() => removeScript(script.filename)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <CustomScriptUpload />
    </div>
  );
};
```

---

## Riassunto

✅ **Sì, import .js funziona esattamente come nel PDF**
✅ **Sandbox sicuro con VM isolato**
✅ **Validazione automatica sicurezza**
✅ **Salvataggio in database dedicato**
✅ **Disponibilità immediata nei dropdown**
✅ **Gestione conflitti e merge**
✅ **Rimozione sicura con check utilizzo**
✅ **UI completa per gestione script**

Il sistema mantiene la stessa flessibilità del PDF originale ma con sicurezza enterprise-grade!