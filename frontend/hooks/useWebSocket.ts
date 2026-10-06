import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

const getSocketURL = () => {
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_WS_URL_ANDROID || 'http://192.168.1.170:3001';
  } else {
    return process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:3001';
  }
};

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const initSocket = async () => {
      try {
        if (!isAuthenticated) {
          console.log('🔌 User not authenticated, skipping WebSocket connection');
          return;
        }

        const token = await AsyncStorage.getItem('@auth_token');
        if (!token) {
          console.log('🔌 No auth token found, skipping WebSocket connection');
          return;
        }

        const socket = io(getSocketURL(), {
          auth: { token },
          transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
          console.log('🔌 Connected to WebSocket server');
        });

        socket.on('new_notification', (notification) => {
          console.log('🔔 Received new notification:', notification);

          // Invalidate and refetch notification queries
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
        });

        socket.on('financial_update', (data) => {
          console.log('💰 Received financial update:', data);

          // Invalidate financial queries
          queryClient.invalidateQueries({ queryKey: ['incomes'] });
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        });

        socket.on('member_update', (data) => {
          console.log('👥 Received member update:', data);

          // Invalidate member queries
          queryClient.invalidateQueries({ queryKey: ['members'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        });

        socket.on('dashboard_update', (data) => {
          console.log('📊 Received dashboard update:', data);

          // Invalidate dashboard queries
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        });

        socket.on('settings_changed', (data) => {
          console.log('⚙️ Received settings change:', data);

          // Invalidate settings queries
          queryClient.invalidateQueries({ queryKey: ['association-settings'] });
        });

        socket.on('new_message', (message) => {
          console.log('💬 Received new message:', message);

          // Invalidate chat queries
          queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        });

        socket.on('user_typing', (data) => {
          console.log('✍️ User typing:', data);
          // Handle typing indicators in chat
        });

        socket.on('user_joined', (data) => {
          console.log('👋 User joined association:', data);
        });

        socket.on('user_left', (data) => {
          console.log('👋 User left association:', data);
        });

        socket.on('user_offline', (data) => {
          console.log('🔴 User went offline:', data);
        });

        socket.on('disconnect', () => {
          console.log('🔌 Disconnected from WebSocket server');
        });

        socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
        });

        socketRef.current = socket;
      } catch (error) {
        console.error('Error initializing WebSocket:', error);
      }
    };

    // Only initialize socket when authenticated
    if (isAuthenticated) {
      initSocket();
    } else {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [queryClient, isAuthenticated]);

  return socketRef.current;
};