import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useAssociationSettings = (associationId: string) => {
  return useQuery({
    queryKey: ['associationSettings', associationId],
    queryFn: () => apiService.getAssociationSettings(associationId),
    enabled: !!associationId,
    staleTime: 0,
    gcTime: 0,
  });
};

export const useUpdateAssociationSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ associationId, settings }: { associationId: string; settings: any }) => 
      apiService.updateAssociationSettings(associationId, settings),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['associationSettings', variables.associationId] });
    },
  });
};