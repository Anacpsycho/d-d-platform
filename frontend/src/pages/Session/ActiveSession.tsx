import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
  Fab,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Casino as DiceIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useSession } from '../../hooks/useSession';
import { useCombat } from '../../hooks/useCombat';
import { useWebSocket } from '../../hooks/useWebSocket';
import InitiativeTracker from '../../components/combat/InitiativeTracker/InitiativeTracker';
import ChatPanel from '../../components/messaging/ChatPanel/ChatPanel';
import DiceRoller from '../../components/dice/DiceRoller/DiceRoller';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const ActiveSession = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { session, events, isLoading } = useSession(id);
  const { combat, nextTurn, endCombat } = useCombat(session?.currentCombatId);
  const { isConnected } = useWebSocket();

  const [tabValue, setTabValue] = useState(0);
  const [chatOpen, setChatOpen] = useState(!isMobile);

  if (isLoading) {
    return (
      <Container>
        <Typography>Loading session...</Typography>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container>
        <Typography>Session not found</Typography>
      </Container>
    );
  }

  const handleUpdateParticipant = (participantId: string, data: any) => {
    if (combat) {
      // Update participant via combat service
      console.log('Update participant:', participantId, data);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Session Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5">
              Session #{session.sessionNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {session.location && `Location: ${session.location}`}
              {!isConnected && ' • Disconnected'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {session.status === 'active' && (
              <Button variant="contained" color="error">
                End Session
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Mobile: Tabs */}
      {isMobile ? (
        <>
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              variant="fullWidth"
            >
              <Tab label="Combat" />
              <Tab label="Events" />
              <Tab label="Dice" />
            </Tabs>
          </Paper>

          <TabPanel value={tabValue} index={0}>
            {combat && (
              <InitiativeTracker
                combat={combat}
                onNextTurn={() => combat && nextTurn(combat._id)}
                onEndCombat={() => combat && endCombat(combat._id)}
                onUpdateParticipant={handleUpdateParticipant}
              />
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Event Log
              </Typography>
              {events.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No events yet
                </Typography>
              ) : (
                events.slice(0, 20).map((event) => (
                  <Box key={event._id} sx={{ mb: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </Typography>
                    <Typography variant="body2">
                      {event.eventType}: {JSON.stringify(event.data)}
                    </Typography>
                  </Box>
                ))
              )}
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <DiceRoller />
          </TabPanel>

          {/* Mobile FABs */}
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => setChatOpen(true)}
          >
            <ChatIcon />
          </Fab>

          {/* Mobile Chat Drawer */}
          <Drawer
            anchor="bottom"
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            PaperProps={{ sx: { height: '80vh' } }}
          >
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={() => setChatOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <ChatPanel campaignId={session.campaignId} sessionId={session._id} />
          </Drawer>
        </>
      ) : (
        /* Desktop: Grid Layout */
        <Grid container spacing={3}>
          {/* Left Column - Combat */}
          <Grid item xs={12} md={combat ? 6 : 8}>
            {combat ? (
              <InitiativeTracker
                combat={combat}
                onNextTurn={() => nextTurn(combat._id)}
                onEndCombat={() => endCombat(combat._id)}
                onUpdateParticipant={handleUpdateParticipant}
              />
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No Active Combat
                </Typography>
                <Button variant="contained" startIcon={<DiceIcon />}>
                  Start Combat
                </Button>
              </Paper>
            )}

            {/* Event Log */}
            <Paper sx={{ p: 2, mt: 3, maxHeight: 400, overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Event Log
              </Typography>
              {events.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No events yet
                </Typography>
              ) : (
                events.slice(0, 20).map((event) => (
                  <Box key={event._id} sx={{ mb: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </Typography>
                    <Typography variant="body2">
                      {event.eventType}
                    </Typography>
                  </Box>
                ))
              )}
            </Paper>
          </Grid>

          {/* Middle Column - Dice & Tools */}
          {combat && (
            <Grid item xs={12} md={3}>
              <DiceRoller />
            </Grid>
          )}

          {/* Right Column - Chat */}
          <Grid item xs={12} md={combat ? 3 : 4}>
            <Box sx={{ position: 'sticky', top: 16, height: 'calc(100vh - 32px)' }}>
              <ChatPanel campaignId={session.campaignId} sessionId={session._id} />
            </Box>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ActiveSession;

// Made with Bob
