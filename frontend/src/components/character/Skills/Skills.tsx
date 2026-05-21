import { Paper, Typography, Box, Grid, Checkbox } from '@mui/material';
import { CharacterSheet, ComputedModifiers } from '../../../types/character.types';

interface SkillsProps {
  character: CharacterSheet;
}

const Skills = ({ character }: SkillsProps) => {
  // Calculate ability modifiers
  const calculateModifiers = (): ComputedModifiers => {
    const scores = { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10, honorOrSanity: 10 };
    
    if (character.abilityScores?.cols) {
      character.abilityScores.cols.forEach((col) => {
        scores.strength += col.scores[0] || 0;
        scores.dexterity += col.scores[1] || 0;
        scores.constitution += col.scores[2] || 0;
        scores.intelligence += col.scores[3] || 0;
        scores.wisdom += col.scores[4] || 0;
        scores.charisma += col.scores[5] || 0;
        scores.honorOrSanity += col.scores[6] || 0;
      });
    }
    
    const calcMod = (score: number) => Math.floor((score - 10) / 2);
    
    return {
      strength: calcMod(scores.strength),
      dexterity: calcMod(scores.dexterity),
      constitution: calcMod(scores.constitution),
      intelligence: calcMod(scores.intelligence),
      wisdom: calcMod(scores.wisdom),
      charisma: calcMod(scores.charisma),
      honorOrSanity: calcMod(scores.honorOrSanity),
    };
  };

  const modifiers = calculateModifiers();

  const skills = [
    { name: 'Acrobatics', key: 'acrobatics', ability: 'dexterity', abbr: 'DEX' },
    { name: 'Animal Handling', key: 'animalHandling', ability: 'wisdom', abbr: 'WIS' },
    { name: 'Arcana', key: 'arcana', ability: 'intelligence', abbr: 'INT' },
    { name: 'Athletics', key: 'athletics', ability: 'strength', abbr: 'STR' },
    { name: 'Deception', key: 'deception', ability: 'charisma', abbr: 'CHA' },
    { name: 'History', key: 'history', ability: 'intelligence', abbr: 'INT' },
    { name: 'Insight', key: 'insight', ability: 'wisdom', abbr: 'WIS' },
    { name: 'Intimidation', key: 'intimidation', ability: 'charisma', abbr: 'CHA' },
    { name: 'Investigation', key: 'investigation', ability: 'intelligence', abbr: 'INT' },
    { name: 'Medicine', key: 'medicine', ability: 'wisdom', abbr: 'WIS' },
    { name: 'Nature', key: 'nature', ability: 'intelligence', abbr: 'INT' },
    { name: 'Perception', key: 'perception', ability: 'wisdom', abbr: 'WIS' },
    { name: 'Performance', key: 'performance', ability: 'charisma', abbr: 'CHA' },
    { name: 'Persuasion', key: 'persuasion', ability: 'charisma', abbr: 'CHA' },
    { name: 'Religion', key: 'religion', ability: 'intelligence', abbr: 'INT' },
    { name: 'Sleight of Hand', key: 'sleightOfHand', ability: 'dexterity', abbr: 'DEX' },
    { name: 'Stealth', key: 'stealth', ability: 'dexterity', abbr: 'DEX' },
    { name: 'Survival', key: 'survival', ability: 'wisdom', abbr: 'WIS' },
  ];

  const formatModifier = (mod: number) => {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Skills
      </Typography>
      <Box>
        {skills.map((skill) => {
          const skillData = character.skills[skill.key as keyof typeof character.skills];
          const abilityMod = modifiers[skill.ability as keyof ComputedModifiers];
          
          let totalBonus = abilityMod + (skillData?.bonus || 0);
          if (skillData?.proficient) {
            totalBonus += character.proficiencyBonus;
          }
          if (skillData?.expertise) {
            totalBonus += character.proficiencyBonus;
          }
          
          return (
            <Box
              key={skill.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 0.5,
                px: 1,
                borderBottom: 1,
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Checkbox
                  checked={skillData?.proficient || false}
                  size="small"
                  disabled
                  sx={{ p: 0, mr: 1 }}
                />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {skill.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  ({skill.abbr})
                </Typography>
              </Box>
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{
                  minWidth: 40,
                  textAlign: 'right',
                  color: skillData?.proficient ? 'primary.main' : 'text.primary',
                }}
              >
                {formatModifier(totalBonus)}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Passive Perception */}
      <Box sx={{ mt: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Passive Perception
            </Typography>
            <Typography variant="h6">
              {10 + modifiers.wisdom + (character.skills.perception?.proficient ? character.proficiencyBonus : 0)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Passive Investigation
            </Typography>
            <Typography variant="h6">
              {10 + modifiers.intelligence + (character.skills.investigation?.proficient ? character.proficiencyBonus : 0)}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default Skills;

// Made with Bob
