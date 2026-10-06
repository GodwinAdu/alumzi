import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Users, Crown, Shield, MoreVertical, UserPlus, AlertTriangle } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { useMembers, useUpdateMember, useDeleteMember, useApproveMember, useRejectMember } from '@/hooks/useMembers';
import { useAuth } from '@/contexts/AuthContext';
import { useSecuritySettings } from '@/hooks/useSecuritySettings';

export default function MemberManagementPage() {
  const router = useRouter();
  const { selectedAssociation } = useAssociation();
  const { user } = useAuth();
  const { shouldRequireTwoFactor } = useSecuritySettings();
  const { data: membersData, isLoading } = useMembers(selectedAssociation?.id || '');
  const updateMemberMutation = useUpdateMember();
  const deleteMemberMutation = useDeleteMember();
  const approveMemberMutation = useApproveMember();
  const rejectMemberMutation = useRejectMember();
  
  const members = membersData?.members || [];
  const currentMember = members.find(m => m.userId === user?.id);
  const userRole = currentMember?.role || 'member';

  const handleMemberAction = (member: any, action: string) => {
    const confirmAction = (title: string, message: string, onConfirm: () => void) => {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: onConfirm, style: action === 'remove' || action === 'suspend' ? 'destructive' : 'default' }
      ]);
    };

    switch (action) {
      case 'promote':
        const requiresTwoFactor = shouldRequireTwoFactor('moderator');
        const promotionMessage = requiresTwoFactor 
          ? `Promote ${member.name} to moderator? They will gain additional permissions and must enable two-factor authentication.`
          : `Promote ${member.name} to moderator? They will gain additional permissions.`;
        
        confirmAction(
          'Promote Member',
          promotionMessage,
          () => updateMemberMutation.mutate({ memberId: member.id, updates: { role: 'moderator' } })
        );
        break;
      case 'demote':
        confirmAction(
          'Demote Member',
          `Demote ${member.name} to regular member? They will lose moderator permissions.`,
          () => updateMemberMutation.mutate({ memberId: member.id, updates: { role: 'member' } })
        );
        break;
      case 'suspend':
        confirmAction(
          'Suspend Member',
          `Suspend ${member.name}? They will lose access to the association.`,
          () => updateMemberMutation.mutate({ memberId: member.id, updates: { status: 'suspended' } })
        );
        break;
      case 'reactivate':
        confirmAction(
          'Reactivate Member',
          `Reactivate ${member.name}? They will regain access to the association.`,
          () => updateMemberMutation.mutate({ memberId: member.id, updates: { status: 'active' } })
        );
        break;
      case 'approve':
        approveMemberMutation.mutate({ associationId: selectedAssociation?.id || '', memberId: member.id });
        break;
      case 'reject':
        rejectMemberMutation.mutate({ associationId: selectedAssociation?.id || '', memberId: member.id });
        break;
      case 'remove':
        confirmAction(
          'Remove Member',
          `Remove ${member.name} from the association? This action cannot be undone.`,
          () => deleteMemberMutation.mutate(member.id)
        );
        break;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown color="#f59e0b" size={16} />;
      case 'moderator': return <Shield color="#667eea" size={16} />;
      default: return <Users color="#666" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'suspended': return '#ef4444';
      default: return '#666';
    }
  };

  if (!selectedAssociation) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Member Management' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No association selected</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Member Management',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#667eea', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        )
      }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Members</Text>
          <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/add-member')}
            >
              <UserPlus color="#667eea" size={16} />
              <Text style={styles.addButtonText}>Add Member</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.pendingButton}
              onPress={() => router.push(`/invite-contacts?associationId=${selectedAssociation.id}`)}
            >
              <Users color="#f59e0b" size={16} />
              <Text style={styles.pendingButtonText}>Invite Contacts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading members...</Text>
          </View>
        ) : (
          <ScrollView style={styles.membersList}>
            {members.map(member => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <View style={styles.memberHeader}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <View style={styles.roleTag}>
                        {getRoleIcon(member.role)}
                        <Text style={styles.roleText}>{member.role}</Text>
                      </View>
                    </View>
                    {member.email && (
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    )}
                    <View style={styles.memberMeta}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(member.status) }]} />
                      <Text style={styles.statusText}>{member.status}</Text>
                      <Text style={styles.joinDate}>
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </Text>
                      {shouldRequireTwoFactor(member.role) && (
                        <View style={styles.twoFactorWarning}>
                          <AlertTriangle color="#f59e0b" size={12} />
                          <Text style={styles.twoFactorText}>2FA Required</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                
                {userRole === 'admin' && member.userId !== user?.id && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      const actions = [
                        { text: 'Cancel', style: 'cancel' as const },
                      ];
                      
                      if (member.status === 'pending') {
                        actions.push(
                          { text: 'Approve', onPress: () => handleMemberAction(member, 'approve') },
                          { text: 'Reject', style: 'destructive' as const, onPress: () => handleMemberAction(member, 'reject') }
                        );
                      } else {
                        if (member.role === 'member') {
                          actions.push({ text: 'Promote to Moderator', onPress: () => handleMemberAction(member, 'promote') });
                        }
                        if (member.role === 'moderator') {
                          actions.push({ text: 'Demote to Member', onPress: () => handleMemberAction(member, 'demote') });
                        }
                        if (member.status === 'active') {
                          actions.push({ text: 'Suspend', style: 'destructive' as const, onPress: () => handleMemberAction(member, 'suspend') });
                        } else if (member.status === 'suspended') {
                          actions.push({ text: 'Reactivate', onPress: () => handleMemberAction(member, 'reactivate') });
                        }
                        actions.push({ text: 'Remove', style: 'destructive' as const, onPress: () => handleMemberAction(member, 'remove') });
                      }
                      
                      Alert.alert('Member Actions', `Choose action for ${member.name}`, actions);
                    }}
                  >
                    <MoreVertical color="#666" size={20} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#667eea',
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pendingButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#92400e',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  membersList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  memberDetails: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
    textTransform: 'capitalize',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  twoFactorWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  twoFactorText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '600' as const,
  },
});