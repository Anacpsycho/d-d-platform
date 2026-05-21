import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  IconButton,
  TextField,
  Button,
  Chip,
  LinearProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  PlayArrow as PlayIcon,
  SkipNext as NextIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Favorite as HeartIcon,
} from '@mui/icons-material';
import { CombatEncounter, CombatParticipant } from '../../../types/session.types';

interface InitiativeTrackerProps {
  combat: CombatEncounter;
  onNextTurn: () => void;
  onEndCombat: () => void;
  onUpdateParticipant: (participantId: string, data: Partial<CombatParticipant>) => void;
  onAddParticipant?: (participant: Partial<CombatParticipant>) => void;
  isMaster?: boolean;
}

const InitiativeTracker = ({
  combat,
  onNextTurn,
  onEndCombat,
  onUpdateParticipant,
  onAddParticipant,
  isMaster = false,
}: InitiativeTrackerProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<CombatParticipant | null>(null);
  const [damageDialogOpen, setDamageDialogOpen] = useState(false);
  const [damageAmount, setDamageAmount] = useState('');

  const sortedParticipants = [...combat.participants]
    .filter((p) => !p.hidden || isMaster)
    .sort((a, b) => b.initiative - a.initiative);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, participant: CombatParticipant) => {
    setAnchorEl(event.currentTarget);
    setSelectedParticipant(participant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedParticipant(null);
  };

  const handleDamage = () => {
    if (selectedParticipant && damageAmount) {
      const damage = parseInt(damageAmount);
      const newHp = Math.max(0, selectedParticipant.currentHp - damage);
      onUpdateParticipant(selectedParticipant.id, { currentHp: newHp });
      setDamageDialogOpen(false);
      setDamageAmount('');
      handleMenuClose();
    }
  };

  const getHPColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 50) return 'success';
    if (percentage > 25) return 'warning';
    return 'error';
  };

  return (
    <>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Initiative Tracker</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {combat.status === 'active' && (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<NextIcon />}
                  onClick={onNextTurn}
                >
                  Next Turn
                </Button>
                {isMaster && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={onEndCombat}
                  >
                    End Combat
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Combat Info */}
        <Box sx={{ mb: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2">
            Round: <strong>{combat.currentRound}</strong>
          </Typography>
          <Typography variant="body2">
            Status: <Chip label={combat.status} size="small" color="primary" />
          </Typography>
        </Box>

        {/* Participants List */}
        <List sx={{ maxHeight: 500, overflow: 'auto' }}>
          {sortedParticipants.map((participant, index) => {
            const isCurrentTurn = index === combat.currentTurn && combat.status === 'active';
            const hpPercentage = (participant.currentHp / participant.maxHp) * 100;

            return (
              <ListItem
                key={participant.id}
                sx={{
                  border: 2,
                  borderColor: isCurrentTurn ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: isCurrentTurn ? 'action.selected' : 'transparent',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                  {/* Initiative */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: 2,
                      borderColor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                    }}
                  >
                    <Typography variant="h6">{participant.initiative}</Typography>
                  </Box>

                  {/* Name and Type */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {participant.name}
                      {participant.hidden && <Chip label="Hidden" size="small" sx={{ ml: 1 }} />}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {participant.type} • AC {participant.armorClass}
                    </Typography>
                  </Box>

                  {/* HP */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                    <HeartIcon color={participant.defeated ? 'disabled' : 'error'} />
                    <Typography variant="body2">
                      {participant.currentHp}/{participant.maxHp}
                    </Typography>
                  </Box>

                  {/* Menu */}
                  {isMaster && (
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, participant)}>
                      <MoreIcon />
                    </IconButton>
                  )}
                </Box>

                {/* HP Bar */}
                <LinearProgress
                  variant="determinate"
                  value={Math.min(hpPercentage, 100)}
                  color={getHPColor(participant.currentHp, participant.maxHp)}
                  sx={{ height: 8, borderRadius: 1, mb: 1 }}
                />

                {/* Conditions */}
                {participant.conditions.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {participant.conditions.map((condition, idx) => (
                      <Chip key={idx} label={condition} size="small" color="warning" />
                    ))}
                  </Box>
                )}

                {isCurrentTurn && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="primary">
                      <PlayIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                      Current Turn
                    </Typography>
                  </Box>
                )}
              </ListItem>
            );
          })}
        </List>

        {isMaster && onAddParticipant && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
            onClick={() => {/* Open add participant dialog */}}
          >
            Add Participant
          </Button>
        )}
      </Paper>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            setDamageDialogOpen(true);
            handleMenuClose();
          }}
        >
          Apply Damage
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedParticipant) {
              onUpdateParticipant(selectedParticipant.id, {
                defeated: !selectedParticipant.defeated,
              });
            }
            handleMenuClose();
          }}
        >
          {selectedParticipant?.defeated ? 'Revive' : 'Mark Defeated'}
        </MenuItem>
      </Menu>

      {/* Damage Dialog */}
      <Dialog open={damageDialogOpen} onClose={() => setDamageDialogOpen(false)}>
        <DialogTitle>Apply Damage to {selectedParticipant?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Damage Amount"
            type="number"
            fullWidth
            value={damageAmount}
            onChange={(e) => setDamageAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDamageDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDamage} variant="contained" color="error">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InitiativeTracker;

// Made with Bob
