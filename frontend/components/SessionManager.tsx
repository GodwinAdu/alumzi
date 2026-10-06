import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSecuritySettings } from '@/hooks/useSecuritySettings';

export const SessionManager = () => {
  const { user, resetSessionTimeout, startSessionTimeout } = useAuth();
  const { getSessionTimeout } = useSecuritySettings();

  useEffect(() => {
    if (!user) return;

    const sessionTimeout = getSessionTimeout();
    
    // Start session timeout when user is authenticated
    startSessionTimeout(sessionTimeout);

    // Handle app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Reset timeout when app becomes active
        resetSessionTimeout(sessionTimeout);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [user, getSessionTimeout, startSessionTimeout, resetSessionTimeout]);

  return null; // This is a utility component with no UI
};