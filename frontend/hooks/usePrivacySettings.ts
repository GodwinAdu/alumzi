import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from './useMembers';

export const usePrivacySettings = () => {
  const { selectedAssociation } = useAssociation();
  const { user } = useAuth();
  const { data: membersData } = useMembers(selectedAssociation?.id || '');
  
  const members = membersData?.members || [];
  const currentMember = members.find(m => m.userId === user?.id);
  const userRole = currentMember?.role || 'member';
  const isMember = !!currentMember;
  
  const settings = selectedAssociation?.settings || {};
  
  return {
    // Privacy checks
    canViewMemberList: isMember && (settings.showMemberList ?? true),
    canViewFinancials: isMember && ((settings.showFinancials ?? false) || ['admin', 'moderator'].includes(userRole)),
    canInviteMembers: isMember && (settings.allowMemberInvites ?? true) && ['admin', 'moderator'].includes(userRole),
    canExportData: isMember && (settings.allowDataExport ?? false),
    isPubliclyVisible: settings.isPublic ?? true,
    requiresApproval: settings.requireApproval ?? true,
    
    // User info
    userRole,
    isMember,
    isAdmin: userRole === 'admin',
    isModerator: userRole === 'moderator',
    canManageSettings: ['admin', 'moderator'].includes(userRole),
  };
};