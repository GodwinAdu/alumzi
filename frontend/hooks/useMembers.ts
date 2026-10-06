import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useMembers = (associationId: string) => {
  return useQuery({
    queryKey: ['members', associationId],
    queryFn: () => apiService.getMembers(associationId),
    enabled: !!associationId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useAddMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiService.addMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.refetchQueries({ queryKey: ['members'] });
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ memberId, updates }: { memberId: string; updates: any }) => 
      apiService.updateMember(memberId, updates),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['members'] });
      await queryClient.refetchQueries({ queryKey: ['members'] });
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (memberId: string) => apiService.deleteMember(memberId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['members'] });
      await queryClient.refetchQueries({ queryKey: ['members'] });
    },
  });
};

export const useMemberStatement = (memberId: string) => {
  return useQuery({
    queryKey: ['memberStatement', memberId],
    queryFn: () => apiService.getMemberStatement(memberId),
    enabled: !!memberId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useApproveMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ associationId, memberId }: { associationId: string; memberId: string }) => 
      apiService.approveMember(associationId, memberId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['members'] });
      await queryClient.refetchQueries({ queryKey: ['members'] });
    },
  });
};

export const useRejectMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ associationId, memberId }: { associationId: string; memberId: string }) => 
      apiService.rejectMember(associationId, memberId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['members'] });
      await queryClient.refetchQueries({ queryKey: ['members'] });
    },
  });
};