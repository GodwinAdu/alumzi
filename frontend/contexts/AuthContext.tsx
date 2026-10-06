import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { User } from '@/types';
import { api } from '@/lib/api';

const AUTH_STORAGE_KEY = '@auth_user';
const TOKEN_STORAGE_KEY = '@auth_token';

export const [AuthContext, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      
      if (storedUser && storedToken) {
        return JSON.parse(storedUser);
      }
      
      return null;
    },
  });

  useEffect(() => {
    if (userQuery.data !== undefined) {
      setUser(userQuery.data);
      setIsLoading(false);
    }
  }, [userQuery.data]);

  const sendOTPMutation = useMutation({
    mutationFn: async ({ identifier, channel, isSignUp }: { identifier: string; channel: 'email' | 'phone'; isSignUp?: boolean }) => {
      return api.sendOTP(identifier, channel, isSignUp);
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ identifier, otp }: { identifier: string; otp: string }) => {
      const data = await api.signIn(identifier, otp);
      
      // If 2FA is required, don't store user data yet
      if (data.requires2FA) {
        return data; // Return the full response including tempToken
      }
      
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      
      // Verify token was stored
      const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      console.log('🔑 Token stored successfully:', storedToken ? 'Yes' : 'No');
      
      return data;
    },
    onSuccess: (data) => {
      // Only set user if 2FA is not required
      if (!data.requires2FA && data.user) {
        setUser(data.user);
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['user-associations'] });
      }
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async ({ name, email, phoneNumber, otp }: { name: string; email: string; phoneNumber: string; otp: string }) => {
      const data = await api.signUp(name, email, phoneNumber, otp);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      return data.user;
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!user) throw new Error('No user logged in');
      const response = await api.updateProfile(updates);
      const updatedUser = response.user;
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const signOut = useCallback(async () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const startSessionTimeout = useCallback((timeoutMinutes: number = 60) => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    sessionTimeoutRef.current = setTimeout(() => {
      console.log('🕐 Session timeout reached, signing out...');
      signOut();
    }, timeoutMinutes * 60 * 1000);
  }, [signOut]);

  const resetSessionTimeout = useCallback((timeoutMinutes: number = 60) => {
    lastActivityRef.current = Date.now();
    startSessionTimeout(timeoutMinutes);
  }, [startSessionTimeout]);

  const checkTokenValidity = useCallback(async () => {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      console.log('⚠️ No token found');
      return false;
    }
    
    try {
      // Decode JWT to check expiration (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        console.log('⚠️ Token expired, signing out...');
        await signOut();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Invalid token format:', error);
      await signOut();
      return false;
    }
  }, [signOut]);
  
  const complete2FALogin = useCallback(async (token: string, userData: User) => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    
    setUser(userData);
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['user-associations'] });
    
    console.log('✅ 2FA login completed, user authenticated');
  }, [queryClient]);

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    sendOTP: sendOTPMutation.mutate,
    signIn: signInMutation.mutate,
    signUp: signUpMutation.mutate,
    signOut,
    updateProfile: updateProfileMutation.mutate,
    checkTokenValidity,
    startSessionTimeout,
    resetSessionTimeout,
    complete2FALogin,
    isSendingOTP: sendOTPMutation.isPending,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
  }), [user, isLoading, sendOTPMutation, signInMutation, signUpMutation, signOut, updateProfileMutation, checkTokenValidity, startSessionTimeout, resetSessionTimeout, complete2FALogin]);
});
