import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ChatMessage = {
  id: string;
  associationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isEdited?: boolean;
  replyTo?: string;
};

export const useChatMessages = (associationId: string) => {
  return useQuery({
    queryKey: ['chat-messages', associationId],
    queryFn: async () => {
      try {
        const response = await api.get(`/associations/${associationId}/chat/messages`);
        return response || { messages: [] };
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        return { messages: [] };
      }
    },
    enabled: !!associationId,
    refetchInterval: false, // We'll use socket for real-time updates
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ associationId, text }: { associationId: string; text: string }) => {
      const response = await api.post(`/associations/${associationId}/chat/messages`, { text });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Don't optimistically update - let the query refetch or socket handle it
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.associationId] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ associationId, messageId }: { associationId: string; messageId: string }) => {
      await api.delete(`/associations/${associationId}/chat/messages/${messageId}`);
      return messageId;
    },
    onSuccess: (messageId, variables) => {
      queryClient.setQueryData(['chat-messages', variables.associationId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.filter((msg: ChatMessage) => msg.id !== messageId)
        };
      });
    },
  });
};