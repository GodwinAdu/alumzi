import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import { useMembers } from './useMembers';

export const useFinancialPermissions = () => {
  const { user } = useAuth();
  const { selectedAssociation } = useAssociation();
  const { data: membersData } = useMembers(selectedAssociation?.id || '');
  
  const members = membersData?.members || [];
  const currentMember = members.find(m => m.userId === user?.id);
  const userRole = currentMember?.role || 'member';
  
  const canCreateContent = userRole !== 'member' || selectedAssociation?.settings?.financial?.allowMemberContributions;
  const canCreateForAnyMember = userRole === 'admin' || userRole === 'moderator';
  const canCreateForSelf = canCreateContent;
  const canManageIncomeTypes = userRole === 'admin' || userRole === 'moderator';
  
  // For members, only allow creating for themselves
  // For admins/moderators, allow creating for any member
  const allowedMemberIds = canCreateForAnyMember 
    ? members.map(m => m.id)
    : currentMember ? [currentMember.id] : [];
  
  return {
    userRole,
    currentMember,
    canCreateContent,
    canCreateForAnyMember,
    canCreateForSelf,
    canManageIncomeTypes,
    allowedMemberIds,
    members: canCreateForAnyMember ? members : currentMember ? [currentMember] : []
  };
};