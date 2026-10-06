import { useAssociation } from '@/contexts/AssociationContext';

export const useSecuritySettings = () => {
  const { selectedAssociation } = useAssociation();
  
  const settings = selectedAssociation?.settings?.security || {
    requireTwoFactorForAdmins: false,
    allowGuestAccess: false,
    sessionTimeout: 60,
  };

  const requiresTwoFactorForAdmins = (): boolean => {
    return settings.requireTwoFactorForAdmins;
  };

  const allowsGuestAccess = (): boolean => {
    return settings.allowGuestAccess;
  };

  const getSessionTimeout = (): number => {
    return settings.sessionTimeout;
  };

  const shouldRequireTwoFactor = (userRole: string): boolean => {
    return settings.requireTwoFactorForAdmins && (userRole === 'admin' || userRole === 'moderator');
  };

  return {
    settings,
    requiresTwoFactorForAdmins,
    allowsGuestAccess,
    getSessionTimeout,
    shouldRequireTwoFactor,
  };
};