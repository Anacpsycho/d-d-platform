import { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Send as SendIcon,
  Casino as DiceIcon,
} from '@mui/icons-material';
import { Message } from '../../../types/session.types';
import { websocketService } from '../../../services/websocket.service';
import { useAuthStore } from '../../../store/authStore';

interface ChatPanelProps {
  campaignId: string;
  sessionId?: string;
  compact?: boolean;
}

const ChatPanel = ({ campaignId, sessionId, compact = false }: ChatPanelProps) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState<{ [userId: string]: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join campaign chat
  useEffect(() => {
    websocketService.joinCampaignChat(campaignId);

    // Listen for messages
    const handleMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    // Listen for typing indicators
    const handleTyping = (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.userId !== user?._id) {
        setIsTyping((prev) => {
          if (data.isTyping) {
            return { ...prev, [data.userId]: data.userName };
          } else {
            const newTyping = { ...prev };
            delete newTyping[data.userId];
            return newTyping;
          }
        });
      }
    };

    websocketService.onMessage(handleMessage);
    websocketService.onTyping(handleTyping);

    return () => {
      websocketService.offMessage(handleMessage);
      websocketService.leaveCampaignChat(campaignId);
    };
  }, [campaignId, user]);

  const handleSend = () => {
    if (!inputValue.trim() || !user) return;

    const message: Partial<Message> = {
      campaignId,
      sessionId,
      senderId: user._id,
      senderName: user.username,
      content: inputValue,
      messageType: 'text',
      isPrivate: false,
      timestamp: new Date(),
      read: false,
    };

    websocketService.sendMessage(message);
    setInputValue('');
    websocketService.sendTyping(campaignId, false);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);

    // Send typing indicator
    if (value.length > 0) {
      websocketService.sendTyping(campaignId, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        websocketService.sendTyping(campaignId, false);
      }, 2000);
    } else {
      websocketService.sendTyping(campaignId, false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: compact ? 400 : '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Campaign Chat</Typography>
      </Box>

      {/* Messages List */}
      <List
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === user?._id;
            const isSystemMessage = message.messageType === 'system';
            const isRollMessage = message.messageType === 'roll';

            if (isSystemMessage) {
              return (
                <Box key={index} sx={{ textAlign: 'center', my: 1 }}>
                  <Chip label={message.content} size="small" />
                </Box>
              );
            }

            return (
              <ListItem
                key={index}
                sx={{
                  flexDirection: 'column',
                  alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                  p: 0,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                    gap: 1,
                    maxWidth: '70%',
                  }}
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {message.senderName[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="caption" fontWeight="bold">
                        {message.senderName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(message.timestamp)}
                      </Typography>
                      {message.isPrivate && (
                        <Chip label="Private" size="small" color="secondary" />
                      )}
                    </Box>
                    <Paper
                      sx={{
                        p: 1.5,
                        bgcolor: isOwnMessage ? 'primary.main' : 'background.default',
                        color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                        borderRadius: 2,
                      }}
                    >
                      {isRollMessage && <DiceIcon sx={{ fontSize: 16, mr: 0.5 }} />}
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </ListItem>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </List>

      {/* Typing Indicator */}
      {Object.keys(isTyping).length > 0 && (
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {Object.values(isTyping).join(', ')} {Object.keys(isTyping).length === 1 ? 'is' : 'are'} typing...
          </Typography>
        </Box>
      )}

      {/* Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Paper>
  );
};

export default ChatPanel;

// Made with Bob
