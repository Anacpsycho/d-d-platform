import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useCharacter } from '../../hooks/useCharacter';
import { CharacterSheet } from '../../types/character.types';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    characters,
    isLoading,
    error,
    fetchCharacters,
    createCharacter,
    deleteCharacter,
    clearError,
  } = useCharacter();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterSheet | null>(null);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const handleCreateCharacter = async () => {
    if (!newCharacterName.trim()) {
      setCreateError('Character name is required');
      return;
    }

    try {
      const character = await createCharacter({
        characterName: newCharacterName,
        level: 1,
        proficiencyBonus: 2,
        experiencePoints: 0,
        abilityScores: {
          cols: [
            {
              type: 'base',
              scores: [10, 10, 10, 10, 10, 10, 10],
            },
          ],
        },
        classes: [],
        maxHitPoints: 10,
        currentHitPoints: 10,
        temporaryHitPoints: 0,
        armorClass: 10,
        initiative: 0,
        speed: 30,
        savingThrows: {
          str: { proficient: false, bonus: 0 },
          dex: { proficient: false, bonus: 0 },
          con: { proficient: false, bonus: 0 },
          int: { proficient: false, bonus: 0 },
          wis: { proficient: false, bonus: 0 },
          cha: { proficient: false, bonus: 0 },
        },
        skills: {
          acrobatics: { proficient: false, expertise: false, bonus: 0 },
          animalHandling: { proficient: false, expertise: false, bonus: 0 },
          arcana: { proficient: false, expertise: false, bonus: 0 },
          athletics: { proficient: false, expertise: false, bonus: 0 },
          deception: { proficient: false, expertise: false, bonus: 0 },
          history: { proficient: false, expertise: false, bonus: 0 },
          insight: { proficient: false, expertise: false, bonus: 0 },
          intimidation: { proficient: false, expertise: false, bonus: 0 },
          investigation: { proficient: false, expertise: false, bonus: 0 },
          medicine: { proficient: false, expertise: false, bonus: 0 },
          nature: { proficient: false, expertise: false, bonus: 0 },
          perception: { proficient: false, expertise: false, bonus: 0 },
          performance: { proficient: false, expertise: false, bonus: 0 },
          persuasion: { proficient: false, expertise: false, bonus: 0 },
          religion: { proficient: false, expertise: false, bonus: 0 },
          sleightOfHand: { proficient: false, expertise: false, bonus: 0 },
          stealth: { proficient: false, expertise: false, bonus: 0 },
          survival: { proficient: false, expertise: false, bonus: 0 },
        },
        armorProficiencies: [],
        weaponProficiencies: [],
        toolProficiencies: [],
        languages: [],
        features: [],
        feats: [],
        equipment: [],
        currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
        spellsKnown: [],
        spellsPrepared: [],
        attacks: [],
        settings: {},
        sourcesConfig: {
          allowedSources: ['PHB'],
          excludedResources: {},
        },
        currentHitDice: {},
        currentFeatures: {},
        activeConditions: [],
        deathSaves: { successes: 0, failures: 0 },
        inCombat: false,
        damageResistances: [],
        damageImmunities: [],
        damageVulnerabilities: [],
        version: '1.0.0',
      });

      setCreateDialogOpen(false);
      setNewCharacterName('');
      setCreateError('');
      navigate(`/character/${character._id}`);
    } catch (err) {
      setCreateError('Failed to create character');
    }
  };

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) return;

    try {
      await deleteCharacter(selectedCharacter._id);
      setDeleteDialogOpen(false);
      setSelectedCharacter(null);
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            My Characters
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            New Character
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Typography>Loading characters...</Typography>
        ) : characters.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No characters yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first character to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Character
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {characters.map((character) => (
              <Grid item xs={12} sm={6} md={4} key={character._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {character.characterName}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Chip label={`Level ${character.level}`} size="small" sx={{ mr: 1 }} />
                      {character.race && <Chip label={character.race} size="small" />}
                    </Box>
                    {character.classes.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        {character.classes.map((c) => c.name).join(', ')}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      HP: {character.currentHitPoints}/{character.maxHitPoints}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/character/${character._id}`)}
                      title="View"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/character/${character._id}`)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelectedCharacter(character);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Create Character Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Character</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Character Name"
            fullWidth
            value={newCharacterName}
            onChange={(e) => {
              setNewCharacterName(e.target.value);
              setCreateError('');
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCharacter} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Character</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedCharacter?.characterName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteCharacter} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;

// Made with Bob
