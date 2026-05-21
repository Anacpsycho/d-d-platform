# D&D Character Sheet PDF - Functions and Interactive Features

## Overview

Il PDF della character sheet contiene numerose funzioni interattive accessibili tramite:
1. **Toolbar buttons** (in alto): icone cliccabili per azioni rapide
2. **Functions panel** (pannello laterale destro): menu con opzioni dettagliate
3. **Bookmarks** (pannello sinistro): navigazione rapida

Questo documento spiega ogni funzione e come implementarla nella web app.

---

## 1. Toolbar Buttons (Barra Superiore)

### 1.1 Layout Button
**Icona**: 📄 (layout/pages icon)
**Funzione**: Gestisce la visibilità e il layout delle pagine

**Cosa fa nel PDF:**
```javascript
// Da Functions1.js
app.addToolButton({
  cName: "LayoutButton",
  cExec: "MakePagesMenu(); PagesOptions();",
  cTooltext: "Set Pages Layout\nSelect which pages are visible..."
});
```

**Implementazione Web App:**
- **Frontend**: Modal/Dialog per selezionare quali sezioni visualizzare
- **Opzioni**:
  - Show/Hide: Character Sheet, Spell Sheet, Companion Page, Notes, Wild Shape
  - Add multiple instances of certain pages
  - Reorder pages
- **Backend**: Salva preferenze layout nel profilo utente
- **Database**: 
  ```sql
  CREATE TABLE user_layout_preferences (
    user_id UUID,
    page_visibility JSONB,
    page_order JSONB
  );
  ```

### 1.2 Reset Button
**Icona**: 🔄 (reset icon)
**Funzione**: Resetta l'intera scheda ai valori iniziali

**Implementazione Web App:**
- **Frontend**: Confirmation dialog con warning
- **Backend API**: `DELETE /api/characters/:id/reset`
- **Logica**: Mantiene ID e user, resetta tutti gli altri campi ai default

### 1.3 Import/Export Button
**Icona**: 📥 (import icon)
**Funzione**: Importa/esporta dati del personaggio

**Cosa fa nel PDF:**
```javascript
// Opzioni disponibili:
- Import from another PDF directly
- Import .xfdf file (deprecato)
- Export .xfdf file
- Add custom script (homebrew content)
```

**Implementazione Web App:**
- **Import**:
  - Upload JSON file
  - Import from D&D Beyond (se API disponibile)
  - Import from altro character sheet
- **Export**:
  - Download as JSON
  - Download as PDF (generato server-side)
  - Share link (pubblico/privato)
- **API Endpoints**:
  ```
  POST /api/characters/:id/import
  GET  /api/characters/:id/export?format=json|pdf
  POST /api/characters/:id/share
  ```

### 1.4 Sources Button
**Icona**: 📚 (book icon)
**Funzione**: Seleziona quali sourcebook utilizzare

**Cosa fa nel PDF:**
Apre dialog per includere/escludere:
- Player's Handbook (PHB)
- Dungeon Master's Guide (DMG)
- Xanathar's Guide to Everything (XGtE)
- Tasha's Cauldron of Everything (TCoE)
- Unearthed Arcana (UA) materials
- Homebrew content

**Implementazione Web App:**
- **Frontend**: Multi-select checklist con categorie
- **Backend**: Filtra reference data in base alle sorgenti selezionate
- **Database**:
  ```sql
  CREATE TABLE character_sources (
    character_id UUID,
    source_key VARCHAR(50),
    enabled BOOLEAN
  );
  ```
- **Logica**: Quando selezioni/deselezioni una source:
  1. Filtra classi/razze/spell disponibili
  2. Rimuovi elementi non più validi dal personaggio
  3. Mostra warning se rimuovi source in uso

### 1.5 Text Options Button
**Icona**: 🔤 (text icon)
**Funzione**: Configura font e dimensioni testo

**Implementazione Web App:**
- **Opzioni**:
  - Font family (serif, sans-serif, dyslexic-friendly)
  - Font size (small, medium, large)
  - Line spacing
  - High contrast mode
- **Storage**: LocalStorage o user preferences
- **CSS**: Dynamic theme switching

### 1.6 Class Button
**Icona**: ⚔️ (sword/class icon)
**Funzione**: Dialog interattivo per selezione classe

**Cosa fa nel PDF:**
```javascript
function SelectClass() {
  // Apre dialog con:
  // - Dropdown per classe
  // - Dropdown per sottoclasse
  // - Input per livello
  // - Preview del nome formattato
  // - Validazione multiclassing
}
```

**Implementazione Web App:**
- **Frontend Component**: `ClassSelectionModal`
  ```typescript
  interface ClassSelectionProps {
    characterId: string;
    currentClasses: CharacterClass[];
    onSave: (classes: CharacterClass[]) => void;
  }
  ```
- **Features**:
  - Add/remove classes
  - Select subclass at appropriate level
  - Validate multiclassing prerequisites
  - Show class features preview
  - Calculate total level
- **Backend**: Valida prerequisites e applica proficiencies

### 1.7 Auto/Manual Button
**Icona**: 🤖/✋ (auto/manual icon)
**Funzione**: Toggle tra calcolo automatico e manuale

**Cosa fa nel PDF:**
Permette di disabilitare l'automazione per:
- Attacks
- Background
- Class features
- Feats
- Race traits

**Implementazione Web App:**
- **Use Case**: Utenti avanzati che vogliono controllo totale
- **Frontend**: Toggle switches per ogni categoria
- **Backend**: Flag `manual_mode` per ogni sezione
- **Logica**: 
  - Se manual: non applica calcoli automatici
  - Se auto: applica tutte le regole e calcoli

### 1.8 Weight Button
**Icona**: ⚖️ (scale icon)
**Funzione**: Calcolo peso e encumbrance

**Implementazione Web App:**
- **Dialog Options**:
  - Select encumbrance rules (standard, variant)
  - Choose what counts toward weight
  - Set carrying capacity multiplier
- **Calculations**:
  ```typescript
  carryingCapacity = strength * 15 * multiplier
  encumbered = totalWeight > capacity
  heavilyEncumbered = totalWeight > capacity * 2
  ```
- **Effects**:
  - Encumbered: -10 ft speed
  - Heavily Encumbered: -20 ft speed, disadvantage on ability checks

### 1.9 Ability Scores Button
**Icona**: 💪 (muscle icon)
**Funzione**: Dialog dettagliato per ability scores

**Cosa fa nel PDF:**
```javascript
function AbilityScores_Button() {
  // Mostra dialog con:
  // - Breakdown di ogni ability score (base, racial, feats, etc.)
  // - Point buy calculator
  // - Magic item overrides
  // - Honor/Sanity variant rules
}
```

**Implementazione Web App:**
- **Frontend Component**: `AbilityScoresModal`
- **Tabs**:
  1. **Point Buy**: Interactive calculator con 27 punti
  2. **Standard Array**: Quick select (15,14,13,12,10,8)
  3. **Manual Entry**: Per rolled stats
  4. **Breakdown**: Mostra tutti i componenti di ogni score
  5. **Overrides**: Magic items che settano score fisso
- **Features**:
  - Real-time point buy validation
  - Show modifier for each score
  - Highlight when at maximum
  - Warning se rimuovi source che dava bonus

### 1.10 Modifiers Button (Blue Text)
**Icona**: 🔵 (blue circle)
**Funzione**: Show/hide campi per modificatori manuali

**Cosa fa nel PDF:**
Mostra campi blu (non stampabili) per aggiungere bonus/penalty a:
- Ability save DC
- Attack to hit/damage
- Proficiency bonus
- Saves
- Skills
- Initiative
- Spell slots
- Carrying capacity

**Implementazione Web App:**
- **Frontend**: Toggle per mostrare "Advanced Modifiers" section
- **UI**: Campi input accanto ai valori calcolati
- **Backend**: Salva come `manual_modifiers` JSONB
- **Display**: `Calculated Value + Manual Modifier = Final Value`

### 1.11 Spells Button
**Icona**: ✨ (sparkles icon)
**Funzione**: Gestione completa spell sheet

**Implementazione Web App:**
- **Menu Options**:
  1. **Generate Spell Sheet**: Wizard per creare spell list
  2. **Manage Spells**: Add/remove/prepare spells
  3. **Spell Slots**: Configure slots visibility
  4. **Spell Points**: Toggle spell points variant
- **Wizard Steps**:
  1. Select spellcasting class
  2. Choose spells known/prepared
  3. Set spell order
  4. Configure display options

### 1.12 Adventurers League Button
**Icona**: 🏛️ (building icon)
**Funzione**: Enable AL-specific fields

**Implementazione Web App:**
- **Toggles**:
  - Show DCI number field
  - Show Faction/Renown
  - Set HP to fixed (not rolled)
  - Hide DMG optional rules
  - Show AL logsheet
- **Validation**: Warn about non-AL legal options

### 1.13 Print Button
**Icona**: 🖨️ (printer icon)
**Funzione**: Stampa pagine selezionate

**Implementazione Web App:**
- **Frontend**: Print dialog con preview
- **Options**:
  - Select pages to print
  - Hide form fields (flatten)
  - Print in color/B&W
- **Backend**: Generate PDF server-side
- **API**: `POST /api/characters/:id/print`

### 1.14 Flatten Button
**Icona**: 📱 (mobile icon)
**Funzione**: Modalità mobile-friendly

**Implementazione Web App:**
- **Responsive Design**: Già implementato con CSS
- **Mobile Optimizations**:
  - Larger touch targets
  - Simplified layout
  - Swipe gestures
  - Offline mode (PWA)

### 1.15 Units Button
**Icona**: 📏 (ruler icon)
**Funzione**: Toggle metric/imperial

**Implementazione Web App:**
- **Options**:
  - Unit system: Imperial (ft, lbs) / Metric (m, kg)
  - Decimal separator: dot / comma
- **Conversion**:
  ```typescript
  const CONVERSIONS = {
    mass: 0.45359237,      // lbs to kg
    length: 0.3048,        // ft to m
    distance: 1.609344     // miles to km
  };
  ```
- **Storage**: User preference

### 1.16 Color Button
**Icona**: 🎨 (palette icon)
**Funzione**: Cambia tema colori

**Implementazione Web App:**
- **Themes**:
  - Default (purple/blue)
  - Red, Green, Blue, Orange, etc.
  - Dark mode
  - High contrast
- **CSS Variables**: Dynamic theme switching
- **Storage**: User preference

### 1.17 FAQ Button
**Icona**: ❓ (question mark icon)
**Funzione**: Help e documentazione

**Implementazione Web App:**
- **Sections**:
  - Getting Started
  - How to use features
  - Rules clarifications
  - Troubleshooting
  - Contact support
- **Search**: Full-text search in FAQ

---

## 2. Functions Panel (Pannello Laterale)

### 2.1 Add Extra Materials
**Funzione**: Importa contenuto homebrew o third-party

**Implementazione Web App:**
- **Upload Options**:
  - JSON file con custom content
  - URL to online repository
  - Manual entry form
- **Content Types**:
  - Custom classes/subclasses
  - Custom races/subraces
  - Custom spells
  - Custom feats
  - Custom magic items
- **Validation**: Check format e compatibilità
- **Storage**: User-specific custom content table

### 2.2 Set Pages Layout
**Funzione**: Identica al Layout Button (vedi 1.1)

### 2.3 Reset
**Funzione**: Identica al Reset Button (vedi 1.2)

### 2.4 Import/Export
**Funzione**: Identica al Import/Export Button (vedi 1.3)

### 2.5 Source Material
**Funzione**: Identica al Sources Button (vedi 1.4)

**Dialog nel PDF:**
```
┌─────────────────────────────────────────────────────────┐
│ Select which resources the sheet's automation should use│
│                                                          │
│ Excluded from automation    │  Included in automation   │
│ ─────────────────────────  │  ───────────────────────  │
│ □ Adventurers League       │  ☑ Player's Handbook      │
│ □ UA: Ranger Revised       │  ☑ Xanathar's Guide       │
│ □ Homebrew Content         │  ☑ Tasha's Cauldron       │
│                            │                            │
│ [Get more content online]  │  [List Source Abbrev.]    │
└─────────────────────────────────────────────────────────┘
```

**Implementazione Web App:**
- **Dual List Box**: Drag & drop tra excluded/included
- **Categories**:
  - Official Books
  - Unearthed Arcana
  - Third Party
  - Homebrew
- **Sync**: Button per aggiornare da Google Sheets

### 2.6 Text Options
**Funzione**: Identica al Text Options Button (vedi 1.5)

### 2.7 Class Selection
**Funzione**: Identica al Class Button (vedi 1.6)

### 2.8 Auto/Manual
**Funzione**: Identica al Auto/Manual Button (vedi 1.7)

### 2.9 Weight
**Funzione**: Identica al Weight Button (vedi 1.8)

### 2.10 Ability Scores
**Funzione**: Identica al Ability Scores Button (vedi 1.9)

### 2.11 Modifiers
**Funzione**: Identica al Modifiers Button (vedi 1.10)

### 2.12 Spells Options
**Funzione**: Identica al Spells Button (vedi 1.11)

### 2.13 Adventurers League
**Funzione**: Identica al Adventurers League Button (vedi 1.12)

### 2.14 Print
**Funzione**: Identica al Print Button (vedi 1.13)

### 2.15 Flatten
**Funzione**: Identica al Flatten Button (vedi 1.14)

### 2.16 Unit System
**Funzione**: Identica al Units Button (vedi 1.15)

---

## 3. Reference Sheet (Pannello Laterale)

### 3.1 Logsheet Entry 5 & 6
**Funzione**: Quick links a adventure log entries

**Implementazione Web App:**
- **Adventure Log Feature**:
  - Date, location, DM name
  - Session notes
  - XP/gold gained
  - Items acquired
  - NPCs met
- **Quick Access**: Recent entries in sidebar

---

## 4. Implementazione Tecnica

### 4.1 Architettura Frontend

```typescript
// Toolbar Component
interface ToolbarButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tooltip: string;
  badge?: number;
}

const Toolbar: React.FC = () => {
  const buttons: ToolbarButton[] = [
    {
      id: 'layout',
      icon: <LayoutIcon />,
      label: 'Layout',
      onClick: () => openModal('layout'),
      tooltip: 'Set Pages Layout'
    },
    // ... altri buttons
  ];

  return (
    <div className="toolbar">
      {buttons.map(btn => (
        <ToolbarButton key={btn.id} {...btn} />
      ))}
    </div>
  );
};
```

### 4.2 Modal System

```typescript
// Modal Manager
interface ModalConfig {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
}

const ModalManager: React.FC = () => {
  const { activeModal, closeModal } = useModal();

  const modals: Record<string, React.ComponentType> = {
    'layout': LayoutModal,
    'class-selection': ClassSelectionModal,
    'ability-scores': AbilityScoresModal,
    'sources': SourcesModal,
    'spells': SpellsModal,
    // ... altri modals
  };

  if (!activeModal) return null;

  const ModalComponent = modals[activeModal.id];
  
  return (
    <Modal onClose={closeModal}>
      <ModalComponent {...activeModal.props} />
    </Modal>
  );
};
```

### 4.3 Sidebar Panel

```typescript
// Functions Panel Component
const FunctionsPanel: React.FC = () => {
  const sections = [
    {
      title: 'Reference Sheet',
      items: [
        { label: 'Logsheet Entry 5', onClick: () => {} },
        { label: 'Logsheet Entry 6', onClick: () => {} }
      ]
    },
    {
      title: 'Functions',
      items: [
        { label: 'Add Extra Materials', onClick: () => openModal('import'), color: 'default' },
        { label: 'Set Pages Layout', onClick: () => openModal('layout'), color: 'red' },
        { label: 'Reset', onClick: () => openModal('reset'), color: 'red' },
        { label: 'Import/Export', onClick: () => openModal('import-export'), color: 'orange' },
        { label: 'Source Material', onClick: () => openModal('sources'), color: 'orange' },
        { label: 'Text Options', onClick: () => openModal('text'), color: 'yellow' },
        { label: 'Class Selection', onClick: () => openModal('class'), color: 'yellow' },
        { label: 'Auto/Manual', onClick: () => openModal('auto-manual'), color: 'green' },
        { label: 'Weight', onClick: () => openModal('weight'), color: 'green' },
        { label: 'Ability Scores', onClick: () => openModal('ability-scores'), color: 'cyan' },
        { label: 'Modifiers', onClick: () => openModal('modifiers'), color: 'cyan' },
        { label: 'Spells Options', onClick: () => openModal('spells'), color: 'blue' },
        { label: 'Adventurers League', onClick: () => openModal('league'), color: 'blue' },
        { label: 'Print', onClick: () => openModal('print'), color: 'purple' },
        { label: 'Flatten', onClick: () => openModal('flatten'), color: 'purple' }
      ]
    }
  ];

  return (
    <aside className="functions-panel">
      {sections.map(section => (
        <Section key={section.title} {...section} />
      ))}
    </aside>
  );
};
```

### 4.4 Backend API per Functions

```typescript
// API Routes per ogni funzione
router.post('/api/characters/:id/reset', resetCharacter);
router.post('/api/characters/:id/import', importCharacter);
router.get('/api/characters/:id/export', exportCharacter);
router.put('/api/characters/:id/sources', updateSources);
router.put('/api/characters/:id/layout', updateLayout);
router.post('/api/characters/:id/calculate-weight', calculateWeight);
router.post('/api/characters/:id/print', generatePDF);

// Service per ogni funzione
class CharacterFunctionsService {
  async resetCharacter(characterId: string): Promise<void> {
    // Reset to defaults
  }

  async importCharacter(characterId: string, data: any): Promise<Character> {
    // Validate and import
  }

  async exportCharacter(characterId: string, format: 'json' | 'pdf'): Promise<Buffer> {
    // Generate export
  }

  async updateSources(characterId: string, sources: string[]): Promise<void> {
    // Update enabled sources
    // Revalidate character
  }

  async calculateWeight(characterId: string): Promise<WeightInfo> {
    // Calculate total weight
    // Check encumbrance
  }
}
```

---

## 5. Priorità di Implementazione

### Phase 1 (MVP):
1. ✅ Class Selection
2. ✅ Ability Scores
3. ✅ Source Material
4. ✅ Import/Export (JSON)
5. ✅ Reset

### Phase 2:
6. Spells Options
7. Weight Calculator
8. Auto/Manual Toggle
9. Modifiers
10. Text Options

### Phase 3:
11. Print/PDF Generation
12. Adventurers League
13. Layout Manager
14. Add Extra Materials
15. Unit System

### Phase 4 (Polish):
16. Color Themes
17. Flatten/Mobile Mode
18. Advanced Features
19. Keyboard Shortcuts
20. Accessibility

---

## 6. User Experience Flow

### Esempio: Creare un nuovo personaggio

1. **Click "New Character"**
   - Mostra wizard multi-step

2. **Step 1: Basic Info**
   - Nome, razza, background
   - Quick stats (point buy/standard array/manual)

3. **Step 2: Class Selection**
   - Click "Class Selection" button
   - Opens ClassSelectionModal
   - Select class, subclass, level
   - Preview features

4. **Step 3: Ability Scores**
   - Click "Ability Scores" button
   - Opens AbilityScoresModal
   - Use point buy calculator
   - Apply racial bonuses

5. **Step 4: Skills & Proficiencies**
   - Auto-populated from class/background
   - Select skill proficiencies
   - Choose expertise (if applicable)

6. **Step 5: Equipment**
   - Select starting equipment
   - Or roll for gold

7. **Step 6: Spells (if caster)**
   - Click "Spells Options"
   - Select known/prepared spells

8. **Step 7: Finalize**
   - Review summary
   - Save character

---

## Conclusione

Tutte le funzioni del PDF possono essere replicate nella web app come:
- **Toolbar buttons**: Quick actions sempre visibili
- **Modals/Dialogs**: Per configurazioni complesse
- **Sidebar panel**: Menu organizzato per categoria
- **Context menus**: Click destro su elementi

La chiave è mantenere la stessa logica e workflow del PDF, ma con un'interfaccia web moderna e responsive.