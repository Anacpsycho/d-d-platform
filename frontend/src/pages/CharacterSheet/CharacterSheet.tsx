import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useState } from 'react';
import { useCharacter } from '../../hooks/useCharacter';
import AbilityScores from '../../components/character/AbilityScores/AbilityScores';
import Skills from '../../components/character/Skills/Skills';
import Combat from '../../components/character/Combat/Combat';
import Spells from '../../components/character/Spells/Spells';
import Equipment from '../../components/character/Equipment/Equipment';
import Features from '../../components/character/Features/Features';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`character-tabpanel-${index}`}
      aria-labelledby={`character-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CharacterSheet = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentCharacter, isLoading, error, fetchCharacter, clearError } = useCharacter(id);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCharacter(id);
    }
  }, [id, fetchCharacter]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }} onClose={clearError}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!currentCharacter) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 4 }}>
          Character not found
        </Alert>
      </Container>
    );
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Character Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" component="h1" gutterBottom>
                {currentCharacter.characterName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {currentCharacter.race && `${currentCharacter.race} `}
                {currentCharacter.classes.map((c) => `${c.name} ${c.level}`).join(' / ')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Level
                  </Typography>
                  <Typography variant="h6">{currentCharacter.level}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    XP
                  </Typography>
                  <Typography variant="h6">{currentCharacter.experiencePoints}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Prof Bonus
                  </Typography>
                  <Typography variant="h6">+{currentCharacter.proficiencyBonus}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Speed
                  </Typography>
                  <Typography variant="h6">{currentCharacter.speed} ft</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Mobile: Tabs for different sections */}
        {isMobile ? (
          <>
            <Paper sx={{ mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="character sheet tabs"
              >
                <Tab label="Stats" />
                <Tab label="Combat" />
                <Tab label="Skills" />
                <Tab label="Spells" />
                <Tab label="Equipment" />
                <Tab label="Features" />
              </Tabs>
            </Paper>

            <TabPanel value={tabValue} index={0}>
              <AbilityScores character={currentCharacter} />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <Combat character={currentCharacter} />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <Skills character={currentCharacter} />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <Spells character={currentCharacter} />
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
              <Equipment character={currentCharacter} />
            </TabPanel>
            <TabPanel value={tabValue} index={5}>
              <Features character={currentCharacter} />
            </TabPanel>
          </>
        ) : (
          /* Desktop: All sections visible */
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={4}>
              <AbilityScores character={currentCharacter} />
              <Box sx={{ mt: 3 }}>
                <Skills character={currentCharacter} />
              </Box>
            </Grid>

            {/* Middle Column */}
            <Grid item xs={12} md={4}>
              <Combat character={currentCharacter} />
              <Box sx={{ mt: 3 }}>
                <Features character={currentCharacter} />
              </Box>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={4}>
              <Spells character={currentCharacter} />
              <Box sx={{ mt: 3 }}>
                <Equipment character={currentCharacter} />
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default CharacterSheet;

// Made with Bob
