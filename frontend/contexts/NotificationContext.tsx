import createContextHook from '@nkzw/create-context-hook';
import { useNotifications } from '@/hooks/useNotifications';
import { useMemo } from 'react';

export const [NotificationContext, useNotificationContext] = createContextHook(() => {
  const { data: notificationsData, refetch } = useNotifications(1, 20);
  
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;
  
  return useMemo(() => ({
    notifications,
    unreadCount,
    refetch,
    hasUnread: unreadCount > 0,
  }), [notifications, unreadCount, refetch]);
});