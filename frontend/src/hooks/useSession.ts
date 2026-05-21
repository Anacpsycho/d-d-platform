import { useEffect, useState, useCallback } from 'react';
import { GameSession, GameEvent } from '../types/session.types';
import { sessionService } from '../services/session.service';
import { websocketService } from '../services/websocket.service';

export const useSession = (sessionId?: string) => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch session
  const fetchSession = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await sessionService.getSession(id);
      setSession(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async (id: string) => {
    try {
      const data = await sessionService.getSessionEvents(id);
      setEvents(data);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
    }
  }, []);

  // Start session
  const startSession = useCallback(async (id: string) => {
    try {
      const data = await sessionService.startSession(id);
      setSession(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start session');
      throw err;
    }
  }, []);

  // End session
  const endSession = useCallback(async (id: string) => {
    try {
      const data = await sessionService.endSession(id);
      setSession(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to end session');
      throw err;
    }
  }, []);

  // Join session via WebSocket
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
      fetchEvents(sessionId);
      websocketService.joinSession(sessionId);

      // Listen for session events
      const handleEvent = (event: GameEvent) => {
        setEvents((prev) => [...prev, event]);
      };

      websocketService.onSessionEvent(handleEvent);

      return () => {
        websocketService.offSessionEvent(handleEvent);
        websocketService.leaveSession(sessionId);
      };
    }
  }, [sessionId, fetchSession, fetchEvents]);

  return {
    session,
    events,
    isLoading,
    error,
    fetchSession,
    fetchEvents,
    startSession,
    endSession,
  };
};

// Made with Bob
