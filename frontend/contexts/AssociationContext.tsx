import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

interface Association {
  id: string;
  name: string;
  type: 'school' | 'community';
  code: string;
  description?: string;
  city?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  role?: string;
  status?: string;
  joinedAt?: string;
  memberCount?: number;
  schoolInfo?: {
    establishedYear?: number;
    address?: string;
    phoneNumber?: string;
    email?: string;
    schoolType?: 'public' | 'private' | 'charter';
    website?: string;
    studentCapacity?: number;
  };
  communityInfo?: {
    foundedYear?: number;
    location?: string;
    contactPhone?: string;
    contactEmail?: string;
    membershipFee?: number;
    meetingSchedule?: string;
    focusAreas?: string[];
    organizationType?: 'nonprofit' | 'religious' | 'social' | 'professional';
    website?: string;
    maxMembers?: number;
  };
  settings?: {
    isPublic?: boolean;
    requireApproval?: boolean;
    allowMemberInvites?: boolean;
    showMemberList?: boolean;
    showFinancials?: boolean;
    allowDataExport?: boolean;
    notifications?: {
      newMembers?: boolean;
      memberRequests?: boolean;
      financialUpdates?: boolean;
      incomeRecorded?: boolean;
      expenseRecorded?: boolean;
      monthlyReports?: boolean;
      eventReminders?: boolean;
      systemUpdates?: boolean;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
    };
    financial?: {
      allowMemberContributions?: boolean;
      requireReceiptUpload?: boolean;
      autoApproveExpenses?: boolean;
      expenseApprovalLimit?: number;
    };
    security?: {
      requireTwoFactorForAdmins?: boolean;
      allowGuestAccess?: boolean;
      sessionTimeout?: number;
    };
    dues?: {
      enabled?: boolean;
      amount?: number;
      frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
      dueDate?: number;
      description?: string;
    };
  };
}

export const [AssociationContext, useAssociation] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [selectedAssociation, setSelectedAssociation] = useState<Association | null>(null);

  const createAssociationMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.createAssociation(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-associations'] });
    },
  });

  const joinAssociationMutation = useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      return api.joinAssociation(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-associations'] });
    },
  });

  const userAssociationsQuery = useQuery({
    queryKey: ['user-associations'],
    queryFn: async () => {
      const token = await AsyncStorage.getItem('@auth_token');
      console.log('🔍 AssociationContext: Checking token...', token ? 'Found' : 'Not found');
      
      if (!token) {
        console.log('⚠️ AssociationContext: No token found, returning empty array');
        return [];
      }
      
      try {
        console.log('🚀 AssociationContext: Fetching user associations...');
        const data = await api.getUserAssociations();
        console.log('✅ AssociationContext: Successfully fetched associations:', data);
        return data.associations || [];
      } catch (error: any) {
        console.error('❌ AssociationContext: Error fetching associations:', error);
        
        // If token is invalid, return empty array instead of throwing
        if (error.message?.includes('token')) {
          console.log('🔄 Token invalid, user needs to sign in again');
          return [];
        }
        
        throw error;
      }
    },
    enabled: true,
    retry: 3,
  });

  // Restore selected association from storage when associations are loaded
  useEffect(() => {
    const restoreSelectedAssociation = async () => {
      const storedId = await AsyncStorage.getItem('@selected_association');
      console.log('🔍 Stored association ID:', storedId);
      console.log('🔍 Available associations:', userAssociationsQuery.data?.map(a => ({ id: a.id || (a as any)._id, name: a.name, role: a.role })));
      
      if (storedId && userAssociationsQuery.data?.length) {
        const association = userAssociationsQuery.data.find(a => a.id === storedId || (a as any)._id === storedId);
        if (association) {
          console.log('🔄 Restoring selected association:', association.name, 'with role:', association.role);
          setSelectedAssociation(association);
        } else {
          console.log('⚠️ Association not found in data, selecting first available');
          const firstAssociation = userAssociationsQuery.data[0];
          if (firstAssociation) {
            console.log('🔄 Selecting first association:', firstAssociation.name, 'with role:', firstAssociation.role);
            setSelectedAssociation(firstAssociation);
            await AsyncStorage.setItem('@selected_association', firstAssociation.id || (firstAssociation as any)._id);
          }
        }
      }
    };
    
    if (userAssociationsQuery.data?.length && !selectedAssociation) {
      restoreSelectedAssociation();
    }
  }, [userAssociationsQuery.data, selectedAssociation]);

  const searchAssociationsMutation = useMutation({
    mutationFn: async ({ query, type }: { query: string; type?: 'school' | 'community' }) => {
      return api.searchAssociations(query, type);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ associationId, members }: {
      associationId: string;
      members: any[];
    }) => {
      return api.addMembers(associationId, members);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-associations'] });
    },
  });

  const updateAssociationMutation = useMutation({
    mutationFn: async ({ associationId, data }: { associationId: string; data: any }) => {
      return api.updateAssociation(associationId, data);
    },
    onSuccess: (updatedData, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-associations'] });
      // Update selected association immediately with the returned data
      const currentId = selectedAssociation?.id || (selectedAssociation as any)?._id;
      if (currentId === variables.associationId && updatedData?.association) {
        console.log('Updating selected association with new data:', updatedData.association);
        // Preserve role and other user-specific fields that aren't returned by the update API
        setSelectedAssociation({
          ...selectedAssociation,
          ...updatedData.association,
          id: updatedData.association.id || updatedData.association._id,
          role: selectedAssociation?.role, // Preserve the user's role
          status: selectedAssociation?.status, // Preserve the user's status
          joinedAt: selectedAssociation?.joinedAt // Preserve join date
        });
      }
    },
  });

  const selectAssociation = useCallback(async (associationId: string) => {
    const associations = userAssociationsQuery.data || [];
    const association = associations.find(a => a.id === associationId || (a as any)._id === associationId);
    
    if (association) {
      console.log('✅ Selecting association:', association.name, 'with role:', association.role);
      setSelectedAssociation(association);
      await AsyncStorage.setItem('@selected_association', association.id || (association as any)._id);
    } else {
      console.log('⚠️ Association not found in list, available IDs:', associations.map((a: Association) => a.id || (a as any)._id));
    }
  }, [userAssociationsQuery.data]);

  const clearSelectedAssociation = useCallback(async () => {
    setSelectedAssociation(null);
    await AsyncStorage.removeItem('@selected_association');
  }, []);

  return useMemo(() => ({
    // Data
    userAssociations: userAssociationsQuery.data || [],
    selectedAssociation,
    
    // Actions
    createAssociation: createAssociationMutation.mutate,
    joinAssociation: (variables: { code: string }, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
      joinAssociationMutation.mutate(variables, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['user-associations'] });
          options?.onSuccess?.();
        },
        onError: (error) => {
          options?.onError?.(error);
        }
      });
    },
    searchAssociations: (variables: { query: string; type?: 'school' | 'community' }, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
      searchAssociationsMutation.mutate(variables, {
        onSuccess: (data) => {
          options?.onSuccess?.();
        },
        onError: (error) => {
          options?.onError?.(error);
        }
      });
    },
    addMember: addMemberMutation.mutate,
    updateAssociation: (variables: { associationId: string; data: any }, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
      updateAssociationMutation.mutate(variables, {
        onSuccess: (data) => {
          options?.onSuccess?.();
        },
        onError: (error) => {
          options?.onError?.(error);
        }
      });
    },
    selectAssociation,
    clearSelectedAssociation,
    
    // Loading states
    isCreating: createAssociationMutation.isPending,
    isJoining: joinAssociationMutation.isPending,
    isSearching: searchAssociationsMutation.isPending,
    isAddingMember: addMemberMutation.isPending,
    isUpdatingAssociation: updateAssociationMutation.isPending,
    isLoadingAssociations: userAssociationsQuery.isLoading,
    
    // Search results
    searchResults: searchAssociationsMutation.data?.associations || [],
  }), [
    userAssociationsQuery.data,
    selectedAssociation,
    createAssociationMutation,
    joinAssociationMutation,
    searchAssociationsMutation,
    addMemberMutation,
    updateAssociationMutation.mutate,
    selectAssociation,
    clearSelectedAssociation,
    userAssociationsQuery.isLoading,
  ]);
});