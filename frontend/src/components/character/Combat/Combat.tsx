import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Favorite as HeartIcon,
  Shield as ShieldIcon,
  Speed as SpeedIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { CharacterSheet } from '../../../types/character.types';
import { useCharacter } from '../../../hooks/useCharacter';

interface CombatProps {
  character: CharacterSheet;
}

const Combat = ({ character }: CombatProps) => {
  const { takeDamage, heal } = useCharacter();
  const [damageDialogOpen, setDamageDialogOpen] = useState(false);
  const [healDialogOpen, setHealDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const hpPercentage = (character.currentHitPoints / character.maxHitPoints) * 100;

  const handleDamage = async () => {
    const dmg = parseInt(amount);
    if (isNaN(dmg) || dmg <= 0) return;

    try {
      await takeDamage(character._id, dmg);
      setDamageDialogOpen(false);
      setAmount('');
    } catch (error) {
      console.error('Failed to apply damage:', error);
    }
  };

  const handleHeal = async () => {
    const healing = parseInt(amount);
    if (isNaN(healing) || healing <= 0) return;

    try {
      await heal(character._id, healing);
      setHealDialogOpen(false);
      setAmount('');
    } catch (error) {
      console.error('Failed to heal:', error);
    }
  };

  const getHPColor = () => {
    if (hpPercentage > 50) return 'success';
    if (hpPercentage > 25) return 'warning';
    return 'error';
  };

  return (
    <>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Combat Stats
        </Typography>

        {/* Hit Points */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <HeartIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="subtitle2">Hit Points</Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold">
              {character.currentHitPoints} / {character.maxHitPoints}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(hpPercentage, 100)}
            color={getHPColor()}
            sx={{ height: 10, borderRadius: 1, mb: 1 }}
          />
          {character.temporaryHitPoints > 0 && (
            <Chip
              label={`+${character.temporaryHitPoints} Temp HP`}
              size="small"
              color="info"
              sx={{ mt: 1 }}
            />
          )}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<RemoveIcon />}
              onClick={() => setDamageDialogOpen(true)}
              fullWidth
            >
              Damage
            </Button>
            <Button
              variant="outlined"
              color="success"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setHealDialogOpen(true)}
              fullWidth
            >
              Heal
            </Button>
          </Box>
        </Box>

        {/* Combat Stats Grid */}
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <ShieldIcon color="primary" />
              <Typography variant="caption" display="block" color="text.secondary">
                Armor Class
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {character.armorClass}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <SpeedIcon color="primary" />
              <Typography variant="caption" display="block" color="text.secondary">
                Initiative
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {character.initiative >= 0 ? '+' : ''}{character.initiative}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" display="block" color="text.secondary">
                Speed
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {character.speed}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ft
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Hit Dice */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Hit Dice
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2">
              {character.hitDiceRemaining || character.hitDiceTotal || '1d8'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total: {character.hitDiceTotal || '1d8'}
            </Typography>
          </Box>
        </Box>

        {/* Death Saves */}
        {character.currentHitPoints === 0 && (
          <Box sx={{ mt: 3, p: 2, border: 1, borderColor: 'error.main', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="error" gutterBottom>
              Death Saves
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption">Successes</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  {[1, 2, 3].map((i) => (
                    <Box
                      key={`success-${i}`}
                      sx={{
                        width: 20,
                        height: 20,
                        border: 1,
                        borderRadius: '50%',
                        bgcolor: i <= character.deathSaves.successes ? 'success.main' : 'transparent',
                      }}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption">Failures</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  {[1, 2, 3].map((i) => (
                    <Box
                      key={`failure-${i}`}
                      sx={{
                        width: 20,
                        height: 20,
                        border: 1,
                        borderRadius: '50%',
                        bgcolor: i <= character.deathSaves.failures ? 'error.main' : 'transparent',
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Active Conditions */}
        {character.activeConditions && character.activeConditions.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Active Conditions
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {character.activeConditions.map((condition, index) => (
                <Chip
                  key={index}
                  label={condition.name}
                  size="small"
                  color="warning"
                  onDelete={() => {/* Handle remove condition */}}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Damage Dialog */}
      <Dialog open={damageDialogOpen} onClose={() => setDamageDialogOpen(false)}>
        <DialogTitle>Apply Damage</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Damage Amount"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDamageDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDamage} variant="contained" color="error">
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Heal Dialog */}
      <Dialog open={healDialogOpen} onClose={() => setHealDialogOpen(false)}>
        <DialogTitle>Heal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Healing Amount"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHealDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleHeal} variant="contained" color="success">
            Heal
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Combat;

// Made with Bob
