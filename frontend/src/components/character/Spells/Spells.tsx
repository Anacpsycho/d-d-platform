import { Paper, Typography, Box, Grid, Chip } from '@mui/material';
import { CharacterSheet } from '../../../types/character.types';

interface SpellsProps {
  character: CharacterSheet;
}

const Spells = ({ character }: SpellsProps) => {
  const hasSpellcasting = character.spellcastingAbility || character.spellSlots;

  if (!hasSpellcasting) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Spellcasting
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No spellcasting ability
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Spellcasting
      </Typography>

      {/* Spellcasting Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Ability
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {character.spellcastingAbility?.toUpperCase() || 'N/A'}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Save DC
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {character.spellSaveDC || 'N/A'}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Attack
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {character.spellAttackBonus !== undefined ? `+${character.spellAttackBonus}` : 'N/A'}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Spell Slots */}
      {character.spellSlots && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Spell Slots
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(character.spellSlots).map(([level, slots]) => (
              <Grid item xs={6} sm={4} key={level}>
                <Box sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Level {level}
                  </Typography>
                  <Typography variant="body2">
                    {slots.max - slots.used} / {slots.max}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Known Spells */}
      {character.spellsKnown && character.spellsKnown.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Spells Known ({character.spellsKnown.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {character.spellsKnown.slice(0, 10).map((spell, index) => (
              <Chip key={index} label={spell} size="small" variant="outlined" />
            ))}
            {character.spellsKnown.length > 10 && (
              <Chip label={`+${character.spellsKnown.length - 10} more`} size="small" />
            )}
          </Box>
        </Box>
      )}

      {/* Prepared Spells */}
      {character.spellsPrepared && character.spellsPrepared.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Prepared Spells ({character.spellsPrepared.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {character.spellsPrepared.slice(0, 10).map((spell, index) => (
              <Chip key={index} label={spell} size="small" color="primary" />
            ))}
            {character.spellsPrepared.length > 10 && (
              <Chip label={`+${character.spellsPrepared.length - 10} more`} size="small" color="primary" />
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default Spells;

// Made with Bob
