# Advanced Logic Documentation - D&D Character Sheet

## Complete Documentation of Parsing, Validation, Manual Management, and Recalculation Logic

---

## Table of Contents

1. [Import/Export System](#importexport-system)
2. [JSON Parsing and Validation](#json-parsing-and-validation)
3. [Source Material Management](#source-material-management)
4. [Class Recalculation Logic](#class-recalculation-logic)
5. [Custom Script Integration](#custom-script-integration)
6. [Resource Exclusion System](#resource-exclusion-system)
7. [Direct Import Functionality](#direct-import-functionality)
8. [Field Import and Validation](#field-import-and-validation)

---

## 1. Import/Export System

### 1.1 Import Entry Points

```javascript
// Main import button handler
function ImportExport_Button() {
    var theMenu = getMenu("importexport");
    switch (theMenu[1]) {
        case "script":
            ImportScriptOptions(theMenu);
            break;
        case "import":
            Import(theMenu[2]);
            break;
        case "export":
            MakeXFDFExport(theMenu[2]);
            break;
        case "direct":
            StartDirectImport();
            break;
    }
}
```

### 1.2 Direct Import Process

**Purpose**: Import all data from another MPMB Character Sheet PDF directly

**Key Features**:
- Opens another PDF file
- Validates it's a MPMB Character Sheet
- Copies all fields, settings, and layout
- Handles version compatibility
- Supports relative and absolute file paths

**Implementation Flow**:

```typescript
// Backend Service: DirectImportService
interface DirectImportConfig {
    filePath: string;
    isRelativePath: boolean;
    importUserIcons: boolean;
}

class DirectImportService {
    async importFromPDF(config: DirectImportConfig): Promise<ImportResult> {
        // 1. Validate source file
        const sourceSheet = await this.validateSourceSheet(config.filePath);
        
        // 2. Check version compatibility
        this.checkVersionCompatibility(sourceSheet.version);
        
        // 3. Reset current sheet
        await this.resetCurrentSheet();
        
        // 4. Import custom scripts
        await this.importCustomScripts(sourceSheet);
        
        // 5. Import source selections
        await this.importSourceSelections(sourceSheet);
        
        // 6. Import character data
        await this.importCharacterData(sourceSheet);
        
        // 7. Import layout settings
        await this.importLayoutSettings(sourceSheet);
        
        return { success: true, warnings: [] };
    }
}
```

---

## 2. JSON Parsing and Validation

### 2.1 Custom Script Files Format

**Structure**:
```javascript
// Stored in field: "User_Imported_Files.Stringified"
var filesScriptFrom = {
    "2024/01/15 - custom_races.js": {
        name: "Custom Races",
        date: "2024/01/15",
        content: "// JavaScript code here",
        version: "1.0"
    },
    "homebrew_classes.js": {
        name: "Homebrew Classes",
        content: "// JavaScript code here"
    }
};
```

**Parsing Logic**:

```typescript
interface CustomScriptFile {
    name: string;
    date?: string;
    content: string;
    version?: string;
}

interface CustomScriptCollection {
    [filename: string]: CustomScriptFile;
}

class CustomScriptParser {
    parseScriptFiles(stringified: string): CustomScriptCollection {
        try {
            const parsed = JSON.parse(stringified);
            return this.validateScriptCollection(parsed);
        } catch (error) {
            throw new ValidationError('Invalid script file format');
        }
    }
    
    validateScriptCollection(data: any): CustomScriptCollection {
        if (typeof data !== 'object' || data === null) {
            throw new ValidationError('Script collection must be an object');
        }
        
        const validated: CustomScriptCollection = {};
        
        for (const [filename, script] of Object.entries(data)) {
            validated[filename] = this.validateScriptFile(script);
        }
        
        return validated;
    }
    
    validateScriptFile(script: any): CustomScriptFile {
        if (!script.content || typeof script.content !== 'string') {
            throw new ValidationError('Script must have content');
        }
        
        return {
            name: script.name || 'Unnamed Script',
            date: script.date,
            content: script.content,
            version: script.version
        };
    }
    
    mergeScriptCollections(
        existing: CustomScriptCollection,
        incoming: CustomScriptCollection
    ): CustomScriptCollection {
        const merged = { ...existing };
        const equalScrNmRx = /\d+\/\d+\/\d+ - |[._\- ]min(ified)?\b/ig;
        
        const existingNames = Object.keys(existing).map(
            name => name.replace(equalScrNmRx, "")
        );
        
        for (const [filename, script] of Object.entries(incoming)) {
            const normalizedName = filename.replace(equalScrNmRx, "");
            
            // Skip if already exists
            if (existingNames.includes(normalizedName)) {
                continue;
            }
            
            merged[filename] = script;
        }
        
        return merged;
    }
}
```

### 2.2 CurrentSources JSON Structure

**Format**:
```javascript
CurrentSources = {
    firstTime: false,
    globalKnown: ["SRD", "PHB", "XGE", "TCE"],
    globalExcl: ["UA:RR", "UA:TMC"],
    classExcl: ["mystic"],
    classExclDefault: ["mystic"],
    racesExcl: ["aarakocra"],
    racesExclDefault: [],
    featsExcl: [],
    featsExclDefault: [],
    spellsExcl: ["wish"],
    spellsExclDefault: [],
    // ... other exclusion arrays
};
```

**Parsing and Validation**:

```typescript
interface SourcesConfiguration {
    firstTime: boolean | string;
    globalKnown: string[];
    globalExcl: string[];
    classExcl?: string[];
    classExclDefault?: string[];
    racesExcl?: string[];
    racesExclDefault?: string[];
    backgrExcl?: string[];
    backgrExclDefault?: string[];
    backFeaExcl?: string[];
    backFeaExclDefault?: string[];
    featsExcl?: string[];
    featsExclDefault?: string[];
    weapExcl?: string[];
    weapExclDefault?: string[];
    armorExcl?: string[];
    armorExclDefault?: string[];
    ammoExcl?: string[];
    ammoExclDefault?: string[];
    magicitemExcl?: string[];
    magicitemExclDefault?: string[];
    spellsExcl?: string[];
    spellsExclDefault?: string[];
    creaExcl?: string[];
    creaExclDefault?: string[];
    compExcl?: string[];
    compExclDefault?: string[];
}

class SourcesParser {
    parseSourcesConfig(stringified: string): SourcesConfiguration {
        try {
            const parsed = JSON.parse(stringified);
            return this.validateSourcesConfig(parsed);
        } catch (error) {
            throw new ValidationError('Invalid sources configuration');
        }
    }
    
    validateSourcesConfig(data: any): SourcesConfiguration {
        const config: SourcesConfiguration = {
            firstTime: data.firstTime ?? false,
            globalKnown: this.validateStringArray(data.globalKnown, 'globalKnown'),
            globalExcl: this.validateStringArray(data.globalExcl, 'globalExcl')
        };
        
        // Validate optional exclusion arrays
        const exclusionTypes = [
            'classExcl', 'racesExcl', 'backgrExcl', 'backFeaExcl',
            'featsExcl', 'weapExcl', 'armorExcl', 'ammoExcl',
            'magicitemExcl', 'spellsExcl', 'creaExcl', 'compExcl'
        ];
        
        for (const type of exclusionTypes) {
            if (data[type]) {
                config[type] = this.validateStringArray(data[type], type);
            }
            if (data[type + 'Default']) {
                config[type + 'Default'] = this.validateStringArray(
                    data[type + 'Default'],
                    type + 'Default'
                );
            }
        }
        
        return config;
    }
    
    validateStringArray(arr: any, fieldName: string): string[] {
        if (!Array.isArray(arr)) {
            throw new ValidationError(`${fieldName} must be an array`);
        }
        
        return arr.filter(item => typeof item === 'string');
    }
}
```

### 2.3 CurrentStats JSON Structure

**Format**:
```javascript
CurrentStats = {
    cols: [
        { type: 'base', scores: [15, 14, 13, 12, 10, 8, 10] },
        { type: 'race', scores: [0, 0, 0, 0, 0, 0, 0] },
        { type: 'feats', scores: [0, 0, 0, 0, 0, 0, 0] },
        { type: 'classes', scores: [0, 0, 0, 0, 0, 0, 0] },
        { type: 'levels', scores: [2, 0, 0, 0, 0, 0, 0] },
        { type: 'magic', scores: [0, 0, 0, 0, 0, 0, 0] },
        { type: 'items', scores: [0, 0, 0, 0, 0, 0, 0] },
        { type: 'override', scores: [0, 0, 0, 0, 0, 0, 0] },
        { type: 'maximum', scores: [20, 20, 20, 20, 20, 20, 20] }
    ]
};
```

**Parsing Logic**:

```typescript
interface AbilityScoreColumn {
    type: 'base' | 'race' | 'feats' | 'classes' | 'levels' | 'magic' | 'items' | 'override' | 'maximum';
    scores: [number, number, number, number, number, number, number]; // Str, Dex, Con, Int, Wis, Cha, HoS
}

interface CurrentStatsConfiguration {
    cols: AbilityScoreColumn[];
}

class AbilityScoresParser {
    parseCurrentStats(stringified: string): CurrentStatsConfiguration {
        try {
            const parsed = JSON.parse(stringified);
            return this.validateCurrentStats(parsed);
        } catch (error) {
            throw new ValidationError('Invalid ability scores configuration');
        }
    }
    
    validateCurrentStats(data: any): CurrentStatsConfiguration {
        if (!data.cols || !Array.isArray(data.cols)) {
            throw new ValidationError('CurrentStats must have cols array');
        }
        
        const validTypes = ['base', 'race', 'feats', 'classes', 'levels', 'magic', 'items', 'override', 'maximum'];
        
        const cols: AbilityScoreColumn[] = data.cols.map((col: any) => {
            if (!validTypes.includes(col.type)) {
                throw new ValidationError(`Invalid column type: ${col.type}`);
            }
            
            if (!Array.isArray(col.scores) || col.scores.length !== 7) {
                throw new ValidationError('Each column must have exactly 7 scores');
            }
            
            const scores = col.scores.map((score: any) => {
                const num = Number(score);
                if (isNaN(num)) {
                    throw new ValidationError('All scores must be numbers');
                }
                return num;
            });
            
            return {
                type: col.type,
                scores: scores as [number, number, number, number, number, number, number]
            };
        });
        
        return { cols };
    }
    
    calculateFinalScore(stats: CurrentStatsConfiguration, abilityIndex: number): number {
        const override = stats.cols.find(c => c.type === 'override')?.scores[abilityIndex] || 0;
        const maximum = stats.cols.find(c => c.type === 'maximum')?.scores[abilityIndex] || 20;
        
        if (override > 0) {
            return Math.min(override, maximum);
        }
        
        let total = 0;
        for (const col of stats.cols) {
            if (col.type !== 'override' && col.type !== 'maximum') {
                total += col.scores[abilityIndex];
            }
        }
        
        return Math.min(total, maximum);
    }
}
```

---

## 3. Source Material Management

### 3.1 Source Selection Dialog

**Purpose**: Allow users to include/exclude sourcebooks and specific content

**Key Features**:
- Hierarchical source organization
- Automatic exclusion of Unearthed Arcana
- Default exclusion flags
- Category-specific exclusions

**Implementation**:

```typescript
interface SourceBook {
    name: string;
    abbreviation: string;
    group: string;
    url?: string;
    date?: string;
    defaultExcluded?: boolean;
}

interface ResourceExclusionOptions {
    exclObj: string; // e.g., "classExcl", "racesExcl"
    name: string; // Display name
    listObj: string; // e.g., "ClassList", "RaceList"
    subAttribute?: string; // e.g., "subclasses", "variants"
    subName?: string; // Display name for sub-items
    subListObj?: string; // e.g., "ClassSubList"
    subListObjName?: string; // Property name in sub-object
}

class SourceManagementService {
    private resourceOptions: ResourceExclusionOptions[] = [
        {
            exclObj: "classExcl",
            name: "Classes",
            listObj: "ClassList",
            subAttribute: "subclasses",
            subName: "Archetypes",
            subListObj: "ClassSubList",
            subListObjName: "subname"
        },
        {
            exclObj: "racesExcl",
            name: "Player Races",
            listObj: "RaceList",
            subAttribute: "variants",
            subName: "Racial Variants",
            subListObj: "RaceSubList"
        },
        {
            exclObj: "featsExcl",
            name: "Feats",
            listObj: "FeatsList",
            subAttribute: "choices"
        },
        {
            exclObj: "spellsExcl",
            name: "Spells/Psionics",
            listObj: "SpellsList"
        }
        // ... more options
    ];
    
    async applyDefaultExclusions(
        currentSources: SourcesConfiguration,
        allSources: Record<string, SourceBook>
    ): Promise<SourcesConfiguration> {
        // Exclude newly added Unearthed Arcana if all were excluded before
        const exclAllUA = currentSources.globalKnown.every(src => {
            const source = allSources[src];
            return !source || 
                   !source.group || 
                   !/unearthed arcana/i.test(source.group) ||
                   currentSources.globalExcl.includes(src);
        });
        
        // Update global known sources
        const newGlobalKnown: string[] = [];
        
        for (const [srcKey, source] of Object.entries(allSources)) {
            newGlobalKnown.push(srcKey);
            
            // Auto-exclude new UA or defaultExcluded sources
            if (!currentSources.globalExcl.includes(srcKey)) {
                if ((exclAllUA && /unearthed arcana/i.test(source.group)) ||
                    (source.defaultExcluded && !currentSources.globalKnown.includes(srcKey))) {
                    currentSources.globalExcl.push(srcKey);
                }
            }
        }
        
        currentSources.globalKnown = newGlobalKnown;
        
        // Apply default exclusions for specific content types
        for (const option of this.resourceOptions) {
            await this.applyContentExclusions(currentSources, option, allSources);
        }
        
        return currentSources;
    }
    
    private async applyContentExclusions(
        currentSources: SourcesConfiguration,
        option: ResourceExclusionOptions,
        allSources: Record<string, SourceBook>
    ): Promise<void> {
        const exclArray = currentSources[option.exclObj] || [];
        const exclDefaultArray = currentSources[option.exclObj + 'Default'] || [];
        
        // Get all content of this type from database
        const contentList = await this.getContentList(option.listObj);
        
        for (const [key, content] of Object.entries(contentList)) {
            if (!content.defaultExcluded) continue;
            
            // Check if source is excluded
            const sourceExcluded = this.isSourceExcluded(content.source, currentSources, allSources);
            
            if (!exclDefaultArray.includes(key)) {
                exclDefaultArray.push(key);
                
                if (!exclArray.includes(key) && !sourceExcluded) {
                    exclArray.push(key);
                }
            }
            
            // Handle sub-content (subclasses, variants, etc.)
            if (option.subAttribute && content[option.subAttribute]) {
                await this.applySubContentExclusions(
                    currentSources,
                    option,
                    key,
                    content,
                    allSources
                );
            }
        }
        
        currentSources[option.exclObj] = exclArray;
        currentSources[option.exclObj + 'Default'] = exclDefaultArray;
    }
}
```

### 3.2 Resource Exclusion Logic

**Automatic Exclusion Rules**:

1. **Unearthed Arcana**: If all UA was excluded before, new UA is auto-excluded
2. **Default Excluded Flag**: Content marked with `defaultExcluded: true` is auto-excluded
3. **Source Exclusion**: If a sourcebook is excluded, all its content is excluded
4. **Version Compatibility**: Content from newer versions may be excluded

```typescript
class ResourceExclusionEngine {
    shouldExcludeContent(
        content: any,
        currentSources: SourcesConfiguration,
        allSources: Record<string, SourceBook>
    ): boolean {
        // Check if content's source is excluded
        if (this.isSourceExcluded(content.source, currentSources, allSources)) {
            return true;
        }
        
        // Check if content is marked as default excluded
        if (content.defaultExcluded) {
            return true;
        }
        
        // Check version compatibility
        if (content.minVersion && !this.isVersionCompatible(content.minVersion)) {
            return true;
        }
        
        return false;
    }
    
    isSourceExcluded(
        sourceRef: string | string[],
        currentSources: SourcesConfiguration,
        allSources: Record<string, SourceBook>
    ): boolean {
        const sources = Array.isArray(sourceRef) ? sourceRef : [sourceRef];
        
        return sources.every(src => {
            // Parse source reference (e.g., "PHB:123" -> "PHB")
            const srcKey = src.split(':')[0];
            return currentSources.globalExcl.includes(srcKey);
        });
    }
}
```

---

## 4. Class Recalculation Logic

### 4.1 Class Selection and Application

**Process Flow**:

```typescript
interface ClassSelection {
    level: number;
    classKey: string;
    className: string;
    subclassKey: string;
}

class ClassRecalculationService {
    async applyClassSelection(selections: ClassSelection[]): Promise<void> {
        // 1. Validate total level
        const totalLevel = selections.reduce((sum, sel) => sum + sel.level, 0);
        if (totalLevel > 20) {
            throw new ValidationError('Total level cannot exceed 20');
        }
        
        // 2. Remove old class features
        await this.removeOldClassFeatures();
        
        // 3. Apply each class
        for (const selection of selections) {
            await this.applyClass(selection);
        }
        
        // 4. Recalculate derived values
        await this.recalculateAll();
    }
    
    private async applyClass(selection: ClassSelection): Promise<void> {
        const classData = await this.getClassData(selection.classKey);
        
        // Apply class features for each level
        for (let level = 1; level <= selection.level; level++) {
            await this.applyClassFeaturesAtLevel(classData, level);
        }
        
        // Apply subclass if selected
        if (selection.subclassKey) {
            const subclassData = await this.getSubclassData(selection.subclassKey);
            await this.applySubclassFeatures(subclassData, selection.level);
        }
        
        // Update proficiencies
        await this.updateProficiencies(classData, selection.level);
        
        // Update spell slots
        if (classData.spellcastingFactor) {
            await this.updateSpellSlots(classData, selection.level);
        }
    }
    
    private async recalculateAll(): Promise<void> {
        // Recalculate in dependency order
        await this.recalculateProficiencyBonus();
        await this.recalculateAbilityScores();
        await this.recalculateAbilityModifiers();
        await this.recalculateSavingThrows();
        await this.recalculateSkills();
        await this.recalculateAC();
        await this.recalculateHP();
        await this.recalculateAttacks();
        await this.recalculateSpellDC();
        await this.recalculateSpellSlots();
    }
}
```

### 4.2 Subclass Change Handling

**When subclass changes**:

```typescript
class SubclassChangeHandler {
    async handleSubclassChange(
        classKey: string,
        oldSubclassKey: string,
        newSubclassKey: string,
        level: number
    ): Promise<void> {
        // 1. Remove old subclass features
        if (oldSubclassKey) {
            await this.removeSubclassFeatures(oldSubclassKey);
        }
        
        // 2. Update class name display
        await this.updateClassNameDisplay(classKey, newSubclassKey);
        
        // 3. Apply new subclass features
        if (newSubclassKey) {
            const subclassData = await this.getSubclassData(newSubclassKey);
            await this.applySubclassFeatures(subclassData, level);
        }
        
        // 4. Recalculate affected values
        await this.recalculateClassDependentValues();
    }
    
    private async updateClassNameDisplay(
        classKey: string,
        subclassKey: string
    ): Promise<void> {
        const classData = await this.getClassData(classKey);
        const subclassData = subclassKey ? await this.getSubclassData(subclassKey) : null;
        
        let displayName: string;
        
        if (!subclassData) {
            displayName = classData.name;
        } else if (subclassData.fullname) {
            displayName = subclassData.fullname;
        } else {
            displayName = `${classData.name} (${subclassData.subname})`;
        }
        
        await this.updateField('className', displayName);
    }
}
```

---

## 5. Custom Script Integration

### 5.1 Script Execution Flow

```typescript
class CustomScriptExecutor {
    async executeCustomScripts(scripts: CustomScriptCollection): Promise<void> {
        // 1. Validate all scripts first
        for (const [filename, script] of Object.entries(scripts)) {
            await this.validateScript(script);
        }
        
        // 2. Execute in order
        for (const [filename, script] of Object.entries(scripts)) {
            try {
                await this.executeScript(script);
            } catch (error) {
                console.error(`Error executing ${filename}:`, error);
                throw new ScriptExecutionError(filename, error);
            }
        }
        
        // 3. Reinitialize lists with new content
        await this.reinitializeLists();
        
        // 4. Update dropdowns
        await this.updateAllDropdowns();
    }
    
    private async validateScript(script: CustomScriptFile): Promise<void> {
        // Check for dangerous operations
        const dangerousPatterns = [
            /eval\(/,
            /Function\(/,
            /setTimeout\(/,
            /setInterval\(/
        ];
        
        for (const pattern of dangerousPatterns) {
            if (pattern.test(script.content)) {
                throw new ValidationError('Script contains potentially dangerous code');
            }
        }
        
        // Validate syntax
        try {
            new Function(script.content);
        } catch (error) {
            throw new ValidationError('Script has syntax errors');
        }
    }
    
    private async executeScript(script: CustomScriptFile): Promise<void> {
        // Create sandboxed execution context
        const context = this.createSandboxContext();
        
        // Execute script
        const scriptFunction = new Function('context', script.content);
        scriptFunction(context);
        
        // Merge results back
        await this.mergeScriptResults(context);
    }
}
```

### 5.2 Script Merging Logic

**When importing scripts from another sheet**:

```typescript
class ScriptMerger {
    mergeScriptCollections(
        currentScripts: CustomScriptCollection,
        importedScripts: CustomScriptCollection
    ): CustomScriptCollection {
        const merged = { ...currentScripts };
        
        // Normalize script names for comparison
        const normalizeScriptName = (name: string): string => {
            return name.replace(/\d+\/\d+\/\d+ - |[._\- ]min(ified)?\b/ig, '');
        };
        
        const currentNames = Object.keys(currentScripts).map(normalizeScriptName);
        
        // Check for "all_WotC_pub+UA.js" special case
        const hasAllPubUA = currentNames.includes('all_WotC_pub+UA.js');
        const rxAllPubUA = /all_WotC_(published|unearthed_arcana)/i;
        
        for (const [filename, script] of Object.entries(importedScripts)) {
            const normalizedName = normalizeScriptName(filename);
            
            // Skip if already exists
            if (currentNames.includes(normalizedName)) {
                continue;
            }
            
            // Skip if covered by all_WotC_pub+UA.js
            if (hasAllPubUA && rxAllPubUA.test(filename)) {
                continue;
            }
            
            merged[filename] = script;
        }
        
        return merged;
    }
}
```

---

## 6. Resource Exclusion System

### 6.1 Exclusion Categories

```typescript
interface ExclusionCategory {
    type: string;
    displayName: string;
    items: ExcludedItem[];
}

interface ExcludedItem {
    id: string;
    name: string;
    source: string;
    isNew: boolean;
}

class ExclusionManager {
    private categories: ExclusionCategory[] = [
        { type: 'classes', displayName: 'Classes/Archetypes', items: [] },
        { type: 'races', displayName: 'Player Races', items: [] },
        { type: 'backgrounds', displayName: 'Backgrounds', items: [] },
        { type: 'feats', displayName: 'Feats', items: [] },
        { type: 'weapons', displayName: 'Weapons/Attacks', items: [] },
        { type: 'armor', displayName: 'Armor', items: [] },
        { type: 'magicitems', displayName: 'Magic Items', items: [] },
        { type: 'spells', displayName: 'Spells/Psionics', items: [] },
        { type: 'creatures', displayName: 'Creatures', items: [] }
    ];
    
    async getExcludedItems(): Promise<ExclusionCategory[]> {
        const result: ExclusionCategory[] = [];
        
        for (const category of this.categories) {
            const items = await this.getExcludedItemsForCategory(category.type);
            if (items.length > 0) {
                result.push({
                    ...category,
                    items
                });
            }
        }
        
        return result;
    }
    
    private async getExcludedItemsForCategory(type: string): Promise<ExcludedItem[]> {
        const exclusionList = await this.getExclusionList(type);
        const contentList = await this.getContentList(type);
        const items: ExcludedItem[] = [];
        
        for (const id of exclusionList) {
            const content = contentList[id];
            if (!content) continue;
            
            items.push({
                id,
                name: this.formatItemName(content),
                source: this.formatSource(content.source),
                isNew: this.isNewExclusion(type, id)
            });
        }
        
        return items.sort((a, b) => a.name.localeCompare(b.name));
    }
}
```

---

## 7. Direct Import Functionality

### 7.1 Version Compatibility Check

```typescript
class VersionCompatibilityChecker {
    checkCompatibility(fromVersion: string, toVersion: string): CompatibilityResult {
        const from = this.parseVersion(fromVersion);
        const to = this.parseVersion(toVersion);
        
        // Cannot import from newer version
        if (from.major > to.major || 
            (from.major === to.major && from.minor > to.minor)) {
            return {
                compatible: false,
                reason: 'Cannot import from newer version',
                action: 'update_current_sheet'
            };
        }
        
        // Cannot import from unsupported beta versions
        if (from.major === 13 && from.minor === 0 && from.isBeta && from.beta < 14) {
            return {
                compatible: false,
                reason: 'Unsupported beta version',
                action: 'cannot_import'
            };
        }
        
        // Warn about old versions with different content structure
        if (from.major < 13) {
            return {
                compatible: true,
                warning: 'Old version may have different content structure',
                requiresConfirmation: true
            };
        }
        
        return { compatible: true };
    }
    
    private parseVersion(version: string): ParsedVersion {
        const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-beta(\d+))?/);
        if (!match) {
            throw new Error('Invalid version format');
        }
        
        return {
            major: parseInt(match[1]),
            minor: parseInt(match[2]),
            patch: parseInt(match[3]),
            isBeta: !!match[4],
            beta: match[4] ? parseInt(match[4]) : 0
        };
    }
}
```

### 7.2 Field Import Logic

```typescript
class FieldImporter {
    async importField(
        fieldName: string,
        options: ImportFieldOptions = {}
    ): Promise<boolean> {
        const sourceField = await this.getSourceField(fieldName);
        const targetField = await this.getTargetField(fieldName);
        
        if (!sourceField || !targetField) {
            return false;
        }
        
        // Check if values are different
        if (sourceField.value === targetField.value) {
            return false;
        }
        
        // Import value
        targetField.value = sourceField.value;
        
        // Import tooltip if not excluded
        if (!options.notTooltip && sourceField.tooltip) {
            targetField.tooltip = sourceField.tooltip;
        }
        
        // Import submit name if not excluded
        if (!options.notSubmitName && sourceField.submitName) {
            targetField.submitName = sourceField.submitName;
        }
        
        // Handle visibility
        if (options.doVisibility) {
            targetField.display = sourceField.display;
        }
        
        return true;
    }
    
    async importFieldArray(fieldNames: string[]): Promise<number> {
        let importedCount = 0;
        
        for (const fieldName of fieldNames) {
            const imported = await this.importField(fieldName);
            if (imported) importedCount++;
        }
        
        return importedCount;
    }
}
```

---

## 8. Field Import and Validation

### 8.1 Import Order and Dependencies

**Critical Import Order**:

```typescript
class ImportOrchestrator {
    async performFullImport(sourceSheet: CharacterSheet): Promise<void> {
        // 1. Reset current sheet
        await this.resetSheet();
        
        // 2. Import custom scripts FIRST
        await this.importCustomScripts(sourceSheet);
        
        // 3. Import source selections
        await this.importSourceSelections(sourceSheet);
        
        // 4. Import ability scores structure
        await this.importAbilityScores(sourceSheet);
        
        // 5. Import level and XP
        await this.importLevelAndXP(sourceSheet);
        
        // 6. Import race (affects ability scores)
        await this.importRace(sourceSheet);
        
        // 7. Import background
        await this.importBackground(sourceSheet);
        
        // 8. Import classes (affects many calculations)
        await this.importClasses(sourceSheet);
        
        // 9. Import feats
        await this.importFeats(sourceSheet);
        
        // 10. Import magic items
        await this.importMagicItems(sourceSheet);
        
        // 11. Import equipment
        await this.importEquipment(sourceSheet);
        
        // 12. Import weapons
        await this.importWeapons(sourceSheet);
        
        // 13. Import spells
        await this.importSpells(sourceSheet);
        
        // 14. Import companions
        await this.importCompanions(sourceSheet);
        
        // 15. Import layout and settings
        await this.importLayoutSettings(sourceSheet);
        
        // 16. Final recalculation
        await this.recalculateAll();
    }
}
```

### 8.2 Validation Rules

```typescript
interface ValidationRule {
    field: string;
    validate: (value: any) => boolean;
    errorMessage: string;
}

class FieldValidator {
    private rules: ValidationRule[] = [
        {
            field: 'Character Level',
            validate: (value) => {
                const level = Number(value);
                return !isNaN(level) && level >= 1 && level <= 20;
            },
            errorMessage: 'Character level must be between 1 and 20'
        },
        {
            field: 'Proficiency Bonus',
            validate: (value) => {
                const bonus = Number(value);
                return !isNaN(bonus) && bonus >= 2 && bonus <= 6;
            },
            errorMessage: 'Proficiency bonus must be between 2 and 6'
        },
        {
            field: 'Ability Scores',
            validate: (scores) => {
                return scores.every((score: number) => 
                    !isNaN(score) && score >= 1 && score <= 30
                );
            },
            errorMessage: 'Ability scores must be between 1 and 30'
        }
    ];
    
    async validateField(fieldName: string, value: any): Promise<ValidationResult> {
        const rule = this.rules.find(r => r.field === fieldName);
        
        if (!rule) {
            return { valid: true };
        }
        
        const valid = rule.validate(value);
        
        return {
            valid,
            errorMessage: valid ? undefined : rule.errorMessage
        };
    }
    
    async validateAllFields(data: Record<string, any>): Promise<ValidationResult[]> {
        const results: ValidationResult[] = [];
        
        for (const [fieldName, value] of Object.entries(data)) {
            const result = await this.validateField(fieldName, value);
            if (!result.valid) {
                results.push({
                    field: fieldName,
                    ...result
                });
            }
        }
        
        return results;
    }
}
```

---

## API Endpoints for Advanced Logic

### Import/Export Endpoints

```typescript
// POST /api/character-sheets/:id/import
interface ImportRequest {
    sourceSheetId?: string;
    sourceFile?: File;
    importOptions: {
        importUserIcons: boolean;
        importCustomScripts: boolean;
        importLayout: boolean;
    };
}

// POST /api/character-sheets/:id/custom-scripts
interface AddCustomScriptRequest {
    filename: string;
    content: string;
    name: string;
    version?: string;
}

// PUT /api/character-sheets/:id/sources
interface UpdateSourcesRequest {
    globalExcl: string[];
    classExcl?: string[];
    racesExcl?: string[];
    featsExcl?: string[];
    spellsExcl?: string[];
}

// POST /api/character-sheets/:id/recalculate
interface RecalculateRequest {
    scope: 'all' | 'abilities' | 'class' | 'spells' | 'attacks';
}
```

---

## Summary

This documentation covers:

1. ✅ **Import/Export System**: Complete flow for importing from other sheets
2. ✅ **JSON Parsing**: All stringified field formats and validation
3. ✅ **Source Management**: Sourcebook selection and exclusion logic
4. ✅ **Class Recalculation**: How classes trigger recalculations
5. ✅ **Custom Scripts**: Integration and execution of user scripts
6. ✅ **Resource Exclusion**: Automatic and manual exclusion rules
7. ✅ **Direct Import**: PDF-to-PDF import functionality
8. ✅ **Field Validation**: Import order and validation rules

All logic is documented with TypeScript interfaces and implementation examples for the backend.