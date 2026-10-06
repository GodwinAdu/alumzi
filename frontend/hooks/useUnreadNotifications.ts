import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const useUnreadNotifications = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const result = await apiService.getNotifications(1, 1);
      return { unreadCount: result.unreadCount || 0 };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: isAuthenticated, // Only run when authenticated
  });
};