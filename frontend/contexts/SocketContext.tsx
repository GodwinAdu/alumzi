import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { ChatMessage } from '@/hooks/useChat';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';

type SocketContextType = {
  socket: Socket | null;
  joinChatRoom: (associationId: string) => void;
  leaveChatRoom: (associationId: string) => void;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  joinChatRoom: () => {},
  leaveChatRoom: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const connect = async () => {
    if (!isAuthenticated || socketRef.current?.connected) return;
    
    const token = await AsyncStorage.getItem('@auth_token');
    if (!token) return;

    const getSocketUrl = () => {
      if (Platform.OS === 'android') {
        return 'http://192.168.1.170:3001';
      }
      return 'http://localhost:3001';
    };

    socketRef.current = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket.IO connected');
    });

    socketRef.current.on('NEW_MESSAGE', (data: any) => {
      handleNewMessage(data.payload);
    });

    socketRef.current.on('MESSAGE_DELETED', (data: any) => {
      handleMessageDeleted(data.payload);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket.IO error:', error);
    });
  };

  const handleNewMessage = (message: ChatMessage) => {
    queryClient.setQueryData(['chat-messages', message.associationId], (old: any) => {
      if (!old) return { messages: [message] };
      const exists = old.messages.some((msg: ChatMessage) => msg.id === message.id);
      if (exists) return old;
      return { ...old, messages: [...old.messages, message] };
    });
  };

  const handleMessageDeleted = ({ associationId, messageId }: { associationId: string; messageId: string }) => {
    queryClient.setQueryData(['chat-messages', associationId], (old: any) => {
      if (!old) return old;
      return { ...old, messages: old.messages.filter((msg: ChatMessage) => msg.id !== messageId) };
    });
  };

  const joinChatRoom = (associationId: string) => {
    socketRef.current?.emit('join-association', associationId);
  };

  const leaveChatRoom = (associationId: string) => {
    socketRef.current?.emit('leave-association', associationId);
  };

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, joinChatRoom, leaveChatRoom }}>
      {children}
    </SocketContext.Provider>
  );
};