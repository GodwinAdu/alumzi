import { useAssociation } from '@/contexts/AssociationContext';

export const useFinancialSettings = () => {
  const { selectedAssociation } = useAssociation();
  
  const settings = selectedAssociation?.settings?.financial || {
    allowMemberContributions: true,
    requireReceiptUpload: false,
    autoApproveExpenses: false,
    expenseApprovalLimit: 1000,
  };

  const checkExpenseAutoApproval = (amount: number): boolean => {
    return settings.autoApproveExpenses && amount <= settings.expenseApprovalLimit;
  };

  const canMembersContribute = (): boolean => {
    return settings.allowMemberContributions;
  };

  const isReceiptRequired = (): boolean => {
    return settings.requireReceiptUpload;
  };

  return {
    settings,
    checkExpenseAutoApproval,
    canMembersContribute,
    isReceiptRequired,
  };
};