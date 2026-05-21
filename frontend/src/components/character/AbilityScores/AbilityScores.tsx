import { Paper, Typography, Grid, Box, Chip } from '@mui/material';
import { CharacterSheet, ComputedAbilityScores, ComputedModifiers } from '../../../types/character.types';

interface AbilityScoresProps {
  character: CharacterSheet;
}

const AbilityScores = ({ character }: AbilityScoresProps) => {
  // Calculate final ability scores by summing all columns
  const calculateAbilityScores = (): ComputedAbilityScores => {
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
    
    return scores;
  };

  // Calculate ability modifiers
  const calculateModifiers = (scores: ComputedAbilityScores): ComputedModifiers => {
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

  const scores = calculateAbilityScores();
  const modifiers = calculateModifiers(scores);

  const abilities = [
    { name: 'Strength', key: 'strength', abbr: 'STR' },
    { name: 'Dexterity', key: 'dexterity', abbr: 'DEX' },
    { name: 'Constitution', key: 'constitution', abbr: 'CON' },
    { name: 'Intelligence', key: 'intelligence', abbr: 'INT' },
    { name: 'Wisdom', key: 'wisdom', abbr: 'WIS' },
    { name: 'Charisma', key: 'charisma', abbr: 'CHA' },
  ];

  const formatModifier = (mod: number) => {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Ability Scores
      </Typography>
      <Grid container spacing={2}>
        {abilities.map((ability) => {
          const score = scores[ability.key as keyof ComputedAbilityScores];
          const modifier = modifiers[ability.key as keyof ComputedModifiers];
          
          return (
            <Grid item xs={6} sm={4} md={12} lg={6} key={ability.key}>
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  textAlign: 'center',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  {ability.abbr}
                </Typography>
                <Typography variant="h4" component="div" sx={{ my: 1 }}>
                  {formatModifier(modifier)}
                </Typography>
                <Chip
                  label={score}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Saving Throws */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Saving Throws
        </Typography>
        <Grid container spacing={1}>
          {abilities.map((ability) => {
            const save = character.savingThrows[ability.key as keyof typeof character.savingThrows];
            const modifier = modifiers[ability.key as keyof ComputedModifiers];
            const totalBonus = modifier + (save?.proficient ? character.proficiencyBonus : 0) + (save?.bonus || 0);
            
            return (
              <Grid item xs={6} key={`save-${ability.key}`}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    border: 1,
                    borderColor: save?.proficient ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    bgcolor: save?.proficient ? 'primary.50' : 'transparent',
                  }}
                >
                  <Typography variant="body2">{ability.abbr}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatModifier(totalBonus)}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Paper>
  );
};

export default AbilityScores;

// Made with Bob
