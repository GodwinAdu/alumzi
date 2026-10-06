import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useIncomes = (associationId: string) => {
  return useQuery({
    queryKey: ['incomes', associationId],
    queryFn: () => apiService.getIncomes(associationId),
    enabled: !!associationId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useCreateIncome = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiService.createIncome(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.refetchQueries({ queryKey: ['incomes'] });
    },
  });
};

export const useUpdateIncome = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ incomeId, data }: { incomeId: string; data: any }) => 
      apiService.updateIncome(incomeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.refetchQueries({ queryKey: ['incomes'] });
    },
  });
};

export const useApproveIncome = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (incomeId: string) => apiService.approveIncome(incomeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.refetchQueries({ queryKey: ['incomes'] });
    },
  });
};

export const useDeleteIncome = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (incomeId: string) => apiService.deleteIncome(incomeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.refetchQueries({ queryKey: ['incomes'] });
    },
  });
};

export const useIncomeTypes = (associationId: string) => {
  return useQuery({
    queryKey: ['incomeTypes', associationId],
    queryFn: () => apiService.getIncomeTypes(associationId),
    enabled: !!associationId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useCreateIncomeType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ associationId, data }: { associationId: string; data: any }) => 
      apiService.createIncomeType(associationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeTypes'] });
      queryClient.refetchQueries({ queryKey: ['incomeTypes'] });
    },
  });
};