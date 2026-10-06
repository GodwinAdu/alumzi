import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useAssociations = () => {
  return useQuery({
    queryKey: ['associations'],
    queryFn: () => apiService.getAssociations(),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useCreateAssociation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiService.createAssociation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associations'] });
      queryClient.refetchQueries({ queryKey: ['associations'] });
    },
  });
};

export const useJoinAssociation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiService.joinAssociation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associations'] });
      queryClient.refetchQueries({ queryKey: ['associations'] });
    },
  });
};

export const useUpdateAssociation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ associationId, data }: { associationId: string; data: any }) => 
      apiService.updateAssociation(associationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associations'] });
      queryClient.refetchQueries({ queryKey: ['associations'] });
    },
  });
};