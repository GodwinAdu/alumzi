import { useAssociation } from '@/contexts/AssociationContext';

export const useNotificationSettings = () => {
  const { selectedAssociation } = useAssociation();
  
  const settings = selectedAssociation?.settings?.notifications || {};
  
  return {
    // Member activity notifications
    newMembers: settings.newMembers ?? true,
    memberRequests: settings.memberRequests ?? true,
    
    // Financial notifications
    financialUpdates: settings.financialUpdates ?? true,
    incomeRecorded: settings.incomeRecorded ?? false,
    expenseRecorded: settings.expenseRecorded ?? false,
    monthlyReports: settings.monthlyReports ?? true,
    
    // General notifications
    eventReminders: settings.eventReminders ?? true,
    systemUpdates: settings.systemUpdates ?? false,
    
    // Delivery methods
    emailNotifications: settings.emailNotifications ?? true,
    pushNotifications: settings.pushNotifications ?? true,
    
    // Helper methods
    isEnabled: (type: string) => {
      const key = type.replace('_', '') as keyof typeof settings;
      return settings[key] ?? true;
    },
    
    shouldNotify: (type: string) => {
      const key = type.replace('_', '') as keyof typeof settings;
      return settings[key] ?? true;
    }
  };
};