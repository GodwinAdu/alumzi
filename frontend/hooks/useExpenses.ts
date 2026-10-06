import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const useExpenses = (associationId: string) => {
  return useQuery({
    queryKey: ['expenses', associationId],
    queryFn: () => apiService.getExpenses(associationId),
    enabled: !!associationId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiService.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.refetchQueries({ queryKey: ['expenses'] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ expenseId, data }: { expenseId: string; data: any }) => 
      apiService.updateExpense(expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.refetchQueries({ queryKey: ['expenses'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (expenseId: string) => apiService.deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.refetchQueries({ queryKey: ['expenses'] });
    },
  });
};

export const useApproveExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (expenseId: string) => apiService.approveExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.refetchQueries({ queryKey: ['expenses'] });
    },
  });
};

export const useExpenseTypes = (associationId: string) => {
  return useQuery({
    queryKey: ['expenseTypes', associationId],
    queryFn: () => apiService.getExpenseTypes(associationId),
    enabled: !!associationId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useCreateExpenseType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ associationId, data }: { associationId: string; data: any }) => 
      apiService.createExpenseType(associationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });
      queryClient.refetchQueries({ queryKey: ['expenseTypes'] });
    },
  });
};

export const useUpdateExpenseType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ associationId, expenseTypeId, data }: { associationId: string; expenseTypeId: string; data: any }) => 
      apiService.updateExpenseType(associationId, expenseTypeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });
      queryClient.refetchQueries({ queryKey: ['expenseTypes'] });
    },
  });
};

export const useDeleteExpenseType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ associationId, expenseTypeId }: { associationId: string; expenseTypeId: string }) => 
      apiService.deleteExpenseType(associationId, expenseTypeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });
      queryClient.refetchQueries({ queryKey: ['expenseTypes'] });
    },
  });
};