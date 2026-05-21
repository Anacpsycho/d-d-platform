# Extracted JavaScript Structures from D&D Character Sheet PDF

## Overview

This document contains the actual data structures, lists, and logic extracted from the JavaScript embedded in the D&D 5E Character Sheet PDF. These structures should be used as reference for implementing the backend data models and business logic.

---

## 1. Core Data Structures

### 1.1 Ability Scores Structure

```javascript
var AbilityScores = {
  abbreviations: ["Str", "Dex", "Con", "Int", "Wis", "Cha"],
  fields: {
    str: "Str", 
    dex: "Dex", 
    con: "Con", 
    'int': "Int", 
    wis: "Wis", 
    cha: "Cha", 
    hos: "HoS", // Honor/Sanity variant
    hon: "HoS", 
    san: "HoS"
  },
  names: ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"],
  "strength": { index: 0 },
  "dexterity": { index: 1 },
  "constitution": { index: 2 },
  "intelligence": { index: 3 },
  "wisdom": { index: 4 },
  "charisma": { index: 5 },
  "improvements": {
    "classlvl": "",
    "classprime": "",
    "classmulti": "",
    "racefeats": ""
  }
};
```

### 1.2 CurrentStats Global Variable

```javascript
CurrentStats = {
  "cols": [
    {
      type: 'base',
      name: "Score Base",
      scores: [8,8,8,8,8,8,8]
    },
    {
      type: 'race',
      name: "Racial Bonus",
      scores: [0,0,0,0,0,0,0]
    },
    {
      type: 'feats',
      name: "Feat Bonus",
      scores: [0,0,0,0,0,0,0]
    },
    {
      type: 'classes',
      name: "Class Bonus",
      scores: [0,0,0,0,0,0,0]
    },
    {
      type: 'levels',
      name: "Level Bonus",
      scores: [0,0,0,0,0,0,0]
    },
    {
      type: 'magic',
      name: "Magic Bonus",
      scores: [0,0,0,0,0,0,0]
    },
    {
      type: 'items',
      name: "Magic Items*",
      scores: [0,0,0,0,0,0,0]
    },
    {
      type: 'override',
      name: "Magical Override",
      scores: [0,0,0,0,0,0,0]
    },
    {
      type: 'maximum',
      name: "Max Total**",
      scores: [20,20,20,20,20,20,20]
    }
  ],
  "txts": {
    "classes": {},
    "race": {},
    "feats": {},
    "items": {},
    "magic": {},
    "background": {}
  },
  "overrides": [{},{},{},{},{},{},{}],
  "maximums": [{},{},{},{},{},{},{}],
  "maximumsLinked": {},
  "maximumsLimited": {}
};
```

### 1.3 Classes Structure

```javascript
var classes = {
  field: "",
  parsed: [],
  known: {},
  old: {},
  hd: {},
  oldhd: {},
  hp: 0,
  attacks: 1,
  totallevel: 0,
  primary: "",
  oldprimary: "",
  spellcastlvl: {default: 0, warlock: 0},
  oldspellcastlvl: {default: 0, warlock: 0}
};
```

---

## 2. Fighting Styles

```javascript
var FightingStyles = {
  archery: {
    name: "Archery Fighting Style",
    description: "+2 bonus to attack rolls I make with ranged weapons",
    calcChanges: {
      atkCalc: [
        function (fields, v, output) {
          if (v.isRangedWeapon && !v.isNaturalWeapon && !v.isDC) 
            output.extraHit += 2;
        },
        "My ranged weapons get a +2 bonus on the To Hit."
      ]
    }
  },
  defense: {
    name: "Defense Fighting Style",
    description: "+1 bonus to AC when I'm wearing armor",
    extraAC: {
      name: "Defense Fighting Style",
      mod: 1,
      text: "I gain a +1 bonus to AC while wearing armor.",
      stopeval: function (v) { return !v.wearingArmor; }
    }
  },
  dueling: {
    name: "Dueling Fighting Style",
    description: "+2 to damage rolls when wielding a melee weapon in one hand and no other weapons",
    calcChanges: {
      atkCalc: [
        function (fields, v, output) {
          for (var i = 1; i <= FieldNumbers.actions; i++) {
            if ((/off.hand.attack/i).test(What('Bonus Action ' + i))) return;
          };
          if (v.isMeleeWeapon && !v.isNaturalWeapon && 
              !(/((^|[^+-]\b)2|\btwo).?hand(ed)?s?\b/i).test(fields.Description)) 
            output.extraDmg += 2;
        },
        "When wielding a melee weapon in one hand and no weapon in other hand, +2 damage."
      ]
    }
  },
  great_weapon: {
    name: "Great Weapon Fighting Style",
    description: "Reroll 1 or 2 on damage if wielding two-handed/versatile melee weapon in both hands",
    calcChanges: {
      atkAdd: [
        function (fields, v) {
          if (v.isMeleeWeapon && (/(\bversatile|((^|[^+-]\b)2|\btwo).?hand(ed)?s?)\b/i).test(fields.Description)) {
            fields.Description += (fields.Description ? '; ' : '') + 
              'Re-roll 1 or 2 on damage die' + 
              ((/versatile/i).test(fields.Description) ? ' when two-handed' : '');
          }
        },
        "While wielding a two-handed or versatile melee weapon in two hands, can re-roll 1 or 2 on damage die once."
      ]
    }
  },
  protection: {
    name: "Protection Fighting Style",
    description: [
      "As a reaction, I can give disadv. on an attack made vs. someone within 5 ft of me",
      "I need to be wielding a shield and be able to see the attacker to do this"
    ],
    action: [["reaction", ""]]
  },
  two_weapon: {
    name: "Two-Weapon Fighting Style",
    description: "I can add my ability modifier to the damage of my off-hand attacks",
    calcChanges: {
      atkCalc: [
        function (fields, v, output) {
          if (v.isOffHand) output.modToDmg = true;
        },
        "When engaging in two-weapon fighting, I can add my ability modifier to off-hand attacks."
      ]
    }
  }
};
```

---

## 3. Spell Level and School Lists

```javascript
var Base_spellLevelList = [
  "Cantrips (0-level)", 
  "1st-level", 
  "2nd-level", 
  "3rd-level", 
  "4th-level", 
  "5th-level", 
  "6th-level", 
  "7th-level", 
  "8th-level", 
  "9th-level", 
  "Talents",      // Psionic
  "Disciplines"   // Psionic
];

var Base_spellSchoolList = {
  "Abjur": "abjuration",
  "Conj": "conjuration",
  "Div": "divination",
  "Ench": "enchantment",
  "Evoc": "evocation",
  "Illus": "illusion",
  "Necro": "necromancy",
  "Trans": "transmutation",
  "Avatar": "avatar",     // Psionic
  "Awake": "awakened",    // Psionic
  "Immor": "immortal",    // Psionic
  "Nomad": "nomad",       // Psionic
  "Wu Jen": "wu jen"      // Psionic
};
```

---

## 4. Calculation Functions

### 4.1 Ability Score Calculation

```javascript
function processStats(AddRemove, inType, NameEntity, inScoresA, dialogTxt, isSpecial, inAlsoHasMax, maxIsLimitToNow) {
  // Redo the arrays, so that they are no longer a reference
  var scoresA = inScoresA && isArray(inScoresA) ? [].concat(inScoresA) : [];
  var alsoHasMax = inAlsoHasMax && isArray(inAlsoHasMax) ? [].concat(inAlsoHasMax) : false;
  
  // initialize some variables
  initiateCurrentStats();
  if (isSpecial && !CurrentStats[isSpecial]) return;
  
  inType = GetFeatureType(inType);
  var type = isSpecial ? isSpecial.replace(/s$/, '') : inType;
  var dialogTxt = dialogTxt ? dialogTxt.replace(/^( |\n)*.*: |;$/g, '') : "";
  var curStat = false;
  
  // Get the column object
  for (var i = 1; i < CurrentStats.cols.length; i++) {
    if (CurrentStats.cols[i].type === type) {
      curStat = CurrentStats.cols[i];
      break;
    }
  }
  
  // Set the ability score changes to the CurrentStats global variable
  for (var s = 0; s < scoresA.length; s++) {
    if (type === "race") curStat.scores[s] = 0;
    if (!scoresA[s]) continue;
    
    if (isSpecial) {
      if (AddRemove) {
        CurrentStats[isSpecial][s][NameEntity] = scoresA[s];
      } else {
        delete CurrentStats[isSpecial][s][NameEntity];
      }
      // now set the new highest override/maximum
      curStat.scores[s] = 0;
      var aMods = [];
      for (var a in CurrentStats[isSpecial][s]) {
        var thisStat = CurrentStats[isSpecial][s][a];
        if (isNaN(thisStat.substring(0,1)) && !isNaN(thisStat.substring(1))) {
          aMods.push(thisStat);
        } else if (!isNaN(thisStat) && thisStat > curStat.scores[s]) {
          curStat.scores[s] = Number(thisStat);
        }
      }
      if (type === "maximum" && !curStat.scores[s]) curStat.scores[s] = 20;
      if (aMods.length) curStat.scores[s] = processModifiers(curStat.scores[s], aMods);
    } else {
      if (AddRemove) {
        curStat.scores[s] += scoresA[s];
      } else if (type !== "race") {
        curStat.scores[s] -= scoresA[s];
      }
    }
  }
}
```

### 4.2 Proficiency Bonus Calculation

```javascript
function calculateProficiencyBonus(characterLevel) {
  return Math.ceil(characterLevel / 4) + 1;
}
```

### 4.3 Ability Modifier Calculation

```javascript
function ASround(input) {
  input = parseFloat(input.replace(",", "."));
  return isNaN(input) ? "0" : Math.round(input).toFixed(0);
}

// Modifier = floor((Score - 10) / 2)
```

### 4.4 Point Buy Calculation

```javascript
function ASCalcPointBuy(theScore) {
  theScore = parseFloat(theScore.replace(",","."));
  if (isNaN(theScore) || theScore <= 8) {
    var toReturn = 0;
  } else {
    var toReturn = theScore - 8;
    if (theScore > 13) toReturn += theScore - 13;
  }
  return toReturn.toFixed(0);
}
```

---

## 5. List Initialization

```javascript
function InitiateLists() {
  var lists = [
    "BackgroundList",
    "BackgroundSubList",
    "BackgroundFeatureList",
    "ClassList",
    "ClassSubList",
    "CompanionList",
    "CreatureList",
    "FeatsList",
    "MagicItemsList",
    "ArmourList",
    "WeaponsList",
    "AmmoList",
    "PacksList",
    "GearList",
    "ToolsList",
    "RaceList",
    "RaceSubList",
    "SourceList",
    "SpellsList",
    "PsionicsList",
    "spellLevelList",
    "spellSchoolList"
  ];
  
  for (i = 0; i < lists.length; i++) {
    if (tDoc["Base_" + lists[i]]) {
      tDoc[lists[i]] = newObj(tDoc["Base_" + lists[i]]);
    } else {
      tDoc[lists[i]] = {};
    };
  };
}
```

---

## 6. Barbarian Class Example

```javascript
"barbarian": {
  regExpSearch: /^((?=.*(marauder|barbarian|viking|(norse|tribes?|clans?)(wo)?m(a|e)n))|((?=.*(warrior|fighter))(?=.*(feral|tribal)))).*$/i,
  name: "Barbarian",
  source: [["SRD", 8], ["P", 46]],
  primaryAbility: "Strength",
  prereqs: "Strength 13",
  improvements: [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5],
  die: 12,
  saves: ["Str", "Con"],
  skillstxt: {
    primary: "Choose two from Animal Handling, Athletics, Intimidation, Nature, Perception, and Survival"
  },
  armorProfs: {
    primary: [true, true, false, true],
    secondary: [false, false, false, true]
  },
  weaponProfs: {
    primary: [true, true],
    secondary: [true, true]
  },
  equipment: "Barbarian starting equipment:" +
    "\n \u2022 A greataxe -or- any martial melee weapon;" +
    "\n \u2022 Two handaxes -or- any simple weapon;" +
    "\n \u2022 An explorer's pack and four javelins.",
  subclasses: ["Primal Path", ["barbarian-berserker"]],
  attacks: [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  features: {
    "rage": {
      name: "Rage",
      source: [["SRD", 8], ["P", 48]],
      minlevel: 1,
      description: [
        "Start/end as bonus action; bonus damage to melee weapon attacks using Str; lasts 1 min",
        "Adv. on Strength checks/saves (not attacks); resistance to bludgeoning/piercing/slashing",
        "Stops if I end turn without attacking or taking damage since last turn, or unconscious"
      ],
      additional: levels.map(function (n) {
        return "+" + (n < 9 ? 2 : n < 16 ? 3 : 4) + " melee damage";
      }),
      usages: [2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, "\u221E\xD7 per "],
      recovery: "long rest",
      action: [["bonus action", " (start/end)"]],
      dmgres: [
        ["Bludgeoning", "Bludgeon. (in rage)"], 
        ["Piercing", "Piercing (in rage)"], 
        ["Slashing", "Slashing (in rage)"]
      ],
      savetxt: { text: ["Adv. on Str saves in rage"] }
    }
  }
}
```

---

## 7. Spell Example Structure

```javascript
"acid splash": {
  name: "Acid Splash",
  classes: ["artificer", "sorcerer", "wizard"],
  source: [["SRD", 114], ["P", 211]],
  level: 0,
  school: "Conj",
  time: "1 a",
  range: "60 ft",
  components: "V,S",
  duration: "Instantaneous",
  save: "Dex",
  description: "1 crea or 2 crea within 5 ft of each other save or 1d6 Acid dmg; +1d6 at CL 5, 11, and 17",
  descriptionCantripDie: "1 crea or 2 crea within 5 ft of each other save or `CD`d6 Acid dmg",
  descriptionFull: "You hurl a bubble of acid. Choose one creature you can see within range, or choose two creatures you can see within range that are within 5 feet of each other. A target must succeed on a Dexterity saving throw or take 1d6 acid damage.\n   This spell's damage increases by 1d6 when you reach 5th Level (2d6), 11th level (3d6) and 17th level (4d6)."
}
```

---

## 8. Spell Slots Table

```javascript
const SPELL_SLOTS_TABLE = {
  // Full casters (Bard, Cleric, Druid, Sorcerer, Wizard)
  full: [
    [2, 0, 0, 0, 0, 0, 0, 0, 0], // Level 1
    [3, 0, 0, 0, 0, 0, 0, 0, 0], // Level 2
    [4, 2, 0, 0, 0, 0, 0, 0, 0], // Level 3
    [4, 3, 0, 0, 0, 0, 0, 0, 0], // Level 4
    [4, 3, 2, 0, 0, 0, 0, 0, 0], // Level 5
    [4, 3, 3, 0, 0, 0, 0, 0, 0], // Level 6
    [4, 3, 3, 1, 0, 0, 0, 0, 0], // Level 7
    [4, 3, 3, 2, 0, 0, 0, 0, 0], // Level 8
    [4, 3, 3, 3, 1, 0, 0, 0, 0], // Level 9
    [4, 3, 3, 3, 2, 0, 0, 0, 0], // Level 10
    [4, 3, 3, 3, 2, 1, 0, 0, 0], // Level 11
    [4, 3, 3, 3, 2, 1, 0, 0, 0], // Level 12
    [4, 3, 3, 3, 2, 1, 1, 0, 0], // Level 13
    [4, 3, 3, 3, 2, 1, 1, 0, 0], // Level 14
    [4, 3, 3, 3, 2, 1, 1, 1, 0], // Level 15
    [4, 3, 3, 3, 2, 1, 1, 1, 0], // Level 16
    [4, 3, 3, 3, 2, 1, 1, 1, 1], // Level 17
    [4, 3, 3, 3, 3, 1, 1, 1, 1], // Level 18
    [4, 3, 3, 3, 3, 2, 1, 1, 1], // Level 19
    [4, 3, 3, 3, 3, 2, 2, 1, 1]  // Level 20
  ]
};
```

---

## 9. Unit System

```javascript
var UnitsList = {
  metric: {
    mass: 0.5,
    'length': 0.3,
    lengthInch: 2.5,
    volume: 0.03,
    surface: 0.1,
    distance: 1.6,
    liquid: 4,
    liquidQuart: 1
  },
  metricExact: {
    mass: 0.45359237,
    'length': 0.3048,
    lengthInch: 2.54,
    volume: 0.028316846592,
    surface: 0.09290304,
    distance: 1.609344,
    liquid: 3.785411784,
    liquidQuart: 0.94635295
  }
};
```

---

## 10. Menu Structure

```javascript
var Menus = {
  "inventory": "",
  "background": "",
  "classfeatures": "",
  "chooselayers": "",
  "gear": "",
  "gearline": "",
  "magicitems": "",
  "color": "",
  "raceoptions": "",
  "faqextended": "",
  "faq": [{
    cName: "Go to the online FAQ (more up to date)",
    cReturn: "faq#online"
  }, {
    cName: "Open the built-in FAQ.pdf",
    cReturn: "faq#pdf"
  }],
  "feats": "",
  "attacks": "",
  "wildshape": "",
  "companion": "",
  "actions": "",
  "limfea": "",
  "pages": "",
  "notes": "",
  "advlog": "",
  "icon": "",
  "spells": "",
  "spellsLine": "",
  "glossary": "",
  "hp": "",
  "texts": "",
  "skills": "",
  "adventureLeague": "",
  "sources": "",
  "unicode": ""
};
```

---

## 11. Source Material Integration

The PDF references external content through the "Source Material" function which connects to:

**Google Sheets URL:**
```
https://docs.google.com/spreadsheets/d/15xq5gP3MujE7nc7POGngFWKLhabkun9BoUW7vvrhkTY/edit?gid=504987056#gid=504987056
```

**Expected Sheets:**
- Classes
- Races
- Spells
- Feats
- Magic Items
- Backgrounds
- Equipment/Gear
- Creatures/Companions

**Integration Method:**
The PDF uses a dialog system to select which sourcebooks to include/exclude:

```javascript
// Sourcebook selection dialog structure
{
  "Excluded from the automation": [
    "Adventurers League",
    "AL: Player's Guide v9.1: Inalorious Redemption (ALPGs9)",
    "Extra Life",
    // ... more sources
  ],
  "Included in the automation": [
    "Acquisitions Incorporated (AI)",
    "Baldur's Gate: Descent into Avernus [background, items] (BGDiA)",
    // ... more sources
  ]
}
```

---

## 12. Field Numbers Configuration

```javascript
var FieldNumbers = {
  langstools: 10,      // Number of language/tool slots
  actions: 6,          // Number of action slots
  trueactions: 3,      // Number of true action slots
  limfea: 20,          // Number of limited feature slots
  attacks: 10,         // Number of attack slots
  magicitems: 10       // Number of magic item slots
};
```

---

## 13. Cantrip Damage Scaling

```javascript
var cantripDie = [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4];
// Index = character level - 1
// Value = number of damage dice
```

---

## Conclusion

These extracted structures provide the foundation for implementing the backend data models and business logic. All calculation functions, data structures, and validation rules should be replicated in the backend to ensure accurate character sheet functionality.

The frontend should never perform these calculations directly but should always request calculated values from the backend API.