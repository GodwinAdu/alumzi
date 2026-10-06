import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAssociation } from '@/contexts/AssociationContext';

export interface SubscriptionLimits {
  memberLimit: number;
  hasPaymentProcessing: boolean;
  hasAdvancedReports: boolean;
  hasCustomTypes: boolean;
  hasEmailNotifications: boolean;
  hasPrioritySupport: boolean;
}

export const useSubscription = () => {
  const { selectedAssociation } = useAssociation();

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscription', selectedAssociation?.id],
    queryFn: () => api.getSubscription(selectedAssociation?.id || ''),
    enabled: !!selectedAssociation?.id,
  });

  const subscription = data?.subscription;
  // Fallback to association plan if subscription API fails
  const plan = subscription?.plan || selectedAssociation?.plan || 'free';

  const limits: SubscriptionLimits = {
    memberLimit: subscription?.memberLimit || 50,
    hasPaymentProcessing: plan !== 'free',
    hasAdvancedReports: plan !== 'free',
    hasCustomTypes: plan !== 'free',
    hasEmailNotifications: plan !== 'free',
    hasPrioritySupport: plan === 'enterprise',
  };

  const canAddMembers = subscription?.currentMembers < limits.memberLimit || limits.memberLimit === -1;

  return {
    subscription,
    plan,
    limits,
    canAddMembers,
    isLoading,
    error,
  };
};