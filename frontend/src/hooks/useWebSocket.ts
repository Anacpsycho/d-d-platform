import { useEffect, useCallback } from 'react';
import { websocketService } from '../services/websocket.service';
import { useAuthStore } from '../store/authStore';

export const useWebSocket = () => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        websocketService.connect(token);
      }
    }

    return () => {
      websocketService.disconnect();
    };
  }, [isAuthenticated]);

  const emit = useCallback((event: string, data: any) => {
    websocketService.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    websocketService.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback: (...args: any[]) => void) => {
    websocketService.off(event, callback);
  }, []);

  return {
    emit,
    on,
    off,
    isConnected: websocketService.isConnected(),
    joinSession: websocketService.joinSession.bind(websocketService),
    leaveSession: websocketService.leaveSession.bind(websocketService),
    joinCombat: websocketService.joinCombat.bind(websocketService),
    leaveCombat: websocketService.leaveCombat.bind(websocketService),
    joinCampaignChat: websocketService.joinCampaignChat.bind(websocketService),
    leaveCampaignChat: websocketService.leaveCampaignChat.bind(websocketService),
    sendMessage: websocketService.sendMessage.bind(websocketService),
    sendTyping: websocketService.sendTyping.bind(websocketService),
  };
};

// Made with Bob
