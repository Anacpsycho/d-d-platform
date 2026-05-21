import { Paper, Typography, Box, List, ListItem, ListItemText, Chip, Grid } from '@mui/material';
import { CharacterSheet } from '../../../types/character.types';

interface EquipmentProps {
  character: CharacterSheet;
}

const Equipment = ({ character }: EquipmentProps) => {
  const totalWeight = character.equipment.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Equipment & Inventory
      </Typography>

      {/* Currency */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Currency
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={2.4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">CP</Typography>
              <Typography variant="body2" fontWeight="bold">{character.currency.cp}</Typography>
            </Box>
          </Grid>
          <Grid item xs={2.4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">SP</Typography>
              <Typography variant="body2" fontWeight="bold">{character.currency.sp}</Typography>
            </Box>
          </Grid>
          <Grid item xs={2.4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">EP</Typography>
              <Typography variant="body2" fontWeight="bold">{character.currency.ep}</Typography>
            </Box>
          </Grid>
          <Grid item xs={2.4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">GP</Typography>
              <Typography variant="body2" fontWeight="bold">{character.currency.gp}</Typography>
            </Box>
          </Grid>
          <Grid item xs={2.4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">PP</Typography>
              <Typography variant="body2" fontWeight="bold">{character.currency.pp}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Equipment List */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">
            Items ({character.equipment.length})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Weight: {totalWeight.toFixed(1)} lb
          </Typography>
        </Box>
        
        {character.equipment.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No equipment
          </Typography>
        ) : (
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {character.equipment.map((item, index) => (
              <ListItem
                key={index}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 0.5,
                  bgcolor: item.equipped ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{item.name}</Typography>
                      {item.equipped && <Chip label="Equipped" size="small" color="primary" />}
                      {item.attuned && <Chip label="Attuned" size="small" color="secondary" />}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      <Typography variant="caption">Qty: {item.quantity}</Typography>
                      {item.weight && <Typography variant="caption">Weight: {item.weight} lb</Typography>}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Attacks */}
      {character.attacks && character.attacks.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Attacks
          </Typography>
          <List dense>
            {character.attacks.map((attack, index) => (
              <ListItem
                key={index}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <ListItemText
                  primary={attack.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        Attack: +{attack.attackBonus} | Damage: {attack.damage} {attack.damageType}
                      </Typography>
                      {attack.range && (
                        <Typography variant="caption" display="block">
                          Range: {attack.range}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
};

export default Equipment;

// Made with Bob
