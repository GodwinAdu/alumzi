import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Users, Crown, Shield, User, MoreVertical, UserPlus, Bell, FileText, UserCheck, DollarSign, CreditCard, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAssociation } from '../../contexts/AssociationContext';
import { useMembers, useUpdateMember, useDeleteMember, useApproveMember, useRejectMember } from '../../hooks/useMembers';
import { useAuth } from '../../contexts/AuthContext';
import { usePrivacySettings } from '../../hooks/usePrivacySettings';
import { ListItemSkeleton, StatCardSkeleton } from '../../components/SkeletonLoader';
import { useWebSocket } from '@/hooks/useWebSocket';

type TabType = 'all' | 'requests' | 'rejected' | 'suspended';

export default function MembersPage() {
  const { userAssociations, selectedAssociation } = useAssociation();
  const { user } = useAuth();
  const association = selectedAssociation || userAssociations?.[0];
  const socket = useWebSocket();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  const { data: membersData, isLoading: loading } = useMembers(association?.id || '');
  const updateMemberMutation = useUpdateMember();
  const privacy = usePrivacySettings();
  
  const members = membersData?.members || [];
  const currentMember = members.find(m => m.userId === user?.id || m.id === user?.id);
  const userRole = currentMember?.role || 'member';
  
  const canManageMembers = userRole === 'admin' || userRole === 'moderator';
  const canManageRoles = userRole === 'admin';
  const canViewAllMembers = privacy.canViewMemberList;
  const canCreateContent = userRole !== 'member' || association?.settings?.financial?.allowMemberContributions;
  
  useEffect(() => {
    if (association?.id && socket) {
      socket.emit('join-association', association.id);
      return () => {
        socket.emit('leave-association', association.id);
      };
    }
  }, [association?.id, socket]);
  
  const updateMember = ({ memberId, updates }: { memberId: string; updates: any }) => {
    updateMemberMutation.mutate({ memberId, updates });
  };

  const deleteMemberMutation = useDeleteMember();
  const approveMemberMutation = useApproveMember();
  const rejectMemberMutation = useRejectMember();
  
  const removeMember = (memberId: string) => {
    deleteMemberMutation.mutate(memberId);
  };

  const approveMember = (memberId: string) => {
    approveMemberMutation.mutate({ associationId: association?.id || '', memberId });
  };

  const rejectMember = (memberId: string) => {
    rejectMemberMutation.mutate({ associationId: association?.id || '', memberId });
  };

  const handleRoleChange = (memberId: string, newRole: 'admin' | 'moderator' | 'member') => {
    updateMember({ memberId, updates: { role: newRole } });
  };

  const handleStatusChange = (memberId: string, newStatus: 'active' | 'suspended' | 'pending') => {
    updateMember({ memberId, updates: { status: newStatus } });
  };

  const showMemberActions = (member: any) => {
    const actions = [];
    
    // Always available actions
    actions.push({
      text: 'View Details',
      onPress: () => router.push(`/member-details?memberId=${member.id}`)
    });
    
    actions.push({
      text: 'View Statement',
      onPress: () => router.push(`/member-statement?memberId=${member.id}`)
    });
    
    // Dues-related actions (if dues are enabled)
    if (association?.settings?.dues?.enabled && userRole !== 'member') {
      // Pay Dues option for admins/moderators only
      actions.push({
        text: 'Pay Dues',
        onPress: () => router.push(`/member-dues?associationId=${association?.id}&memberId=${member.id}`)
      });
      
      // Request Payment option for admins
      if (userRole === 'admin') {
        actions.push({
          text: 'Request Payment',
          onPress: () => {
            Alert.alert(
              'Request Payment',
              `Send payment reminder to ${member.name}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send Reminder',
                  onPress: () => Alert.alert('Success', 'Payment reminder sent!')
                }
              ]
            );
          }
        });
      }
    }
    
    // Pending member actions
    if (member.status === 'pending' && canManageMembers) {
      actions.push({
        text: 'Approve Request',
        onPress: () => approveMember(member.id)
      });
      actions.push({
        text: 'Reject Request',
        onPress: () => rejectMember(member.id)
      });
    }
    
    // Admin actions
    if (userRole === 'admin') {
      actions.push({
        text: 'Edit Member',
        onPress: () => router.push(`/edit-member?memberId=${member.id}`)
      });
      
      if (member.userId !== user?.id) {
        actions.push({
          text: 'Make Admin',
          onPress: () => handleRoleChange(member.id, 'admin')
        });
        actions.push({
          text: 'Make Moderator',
          onPress: () => handleRoleChange(member.id, 'moderator')
        });
        actions.push({
          text: 'Make Member',
          onPress: () => handleRoleChange(member.id, 'member')
        });
        
        if (member.status === 'active') {
          actions.push({
            text: 'Suspend',
            onPress: () => handleStatusChange(member.id, 'suspended')
          });
        } else {
          actions.push({
            text: 'Reactivate',
            onPress: () => handleStatusChange(member.id, 'active')
          });
        }
        
        actions.push({
          text: 'Remove Member',
          style: 'destructive',
          onPress: () => removeMember(member.id)
        });
      }
    }
    
    // Moderator actions
    if (userRole === 'moderator' && member.userId !== user?.id && member.role !== 'admin') {
      if (member.status === 'active') {
        actions.push({
          text: 'Suspend',
          onPress: () => handleStatusChange(member.id, 'suspended')
        });
      } else {
        actions.push({
          text: 'Reactivate',
          onPress: () => handleStatusChange(member.id, 'active')
        });
      }
    }
    
    actions.push({ text: 'Cancel', style: 'cancel' });
    
    Alert.alert(
      member.name,
      `${member.role.charAt(0).toUpperCase() + member.role.slice(1)} • ${member.status.charAt(0).toUpperCase() + member.status.slice(1)}`,
      actions
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown color="#f59e0b" size={16} />;
      case 'moderator':
        return <Shield color="#3b82f6" size={16} />;
      default:
        return <User color="#6b7280" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'suspended':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getFilteredMembers = () => {
    let filtered;
    switch (activeTab) {
      case 'requests':
        filtered = members.filter(m => m.status === 'pending');
        break;
      case 'rejected':
        filtered = members.filter(m => m.status === 'rejected');
        break;
      case 'suspended':
        filtered = members.filter(m => m.status === 'suspended');
        break;
      default:
        filtered = members.filter(m => m.status === 'active');
        break;
    }
    
    // Apply privacy settings for member list visibility
    if (!canViewAllMembers && userRole === 'member') {
      return filtered.filter(m => m.userId === user?.id || m.id === user?.id);
    }
    
    return filtered;
  };

  const renderMemberActions = () => {
    if (userRole === 'member') {
      return (
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/member-statement?memberId=${currentMember?.id}`)}
          >
            <FileText color="#667eea" size={24} />
            <Text style={styles.actionText}>My Statement</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.actionGrid}>
        {canManageMembers && (
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push({ pathname: '/add-member-entry', params: { associationId: association?.id } })}
            >
              <UserPlus color="#667eea" size={24} />
              <Text style={styles.actionText}>Add Member</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/member-statement')}
            >
              <FileText color="#667eea" size={24} />
              <Text style={styles.actionText}>Member Statement</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {renderMemberActions()}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All Members</Text>
        </TouchableOpacity>
        {canManageMembers && (
          <>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Join Requests</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'suspended' && styles.activeTab]}
              onPress={() => setActiveTab('suspended')}
            >
              <Text style={[styles.tabText, activeTab === 'suspended' && styles.activeTabText]}>Suspended</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{members.filter(m => m.status === 'active').length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{members.filter(m => m.status === 'pending').length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{members.filter(m => m.status === 'suspended').length}</Text>
            <Text style={styles.statLabel}>Suspended</Text>
          </View>
        </View>

        {loading ? (
          <>
            <View style={styles.stats}>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </View>
            <View style={styles.membersList}>
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
            </View>
          </>
        ) : !canViewAllMembers && userRole === 'member' ? (
          <View style={styles.emptyState}>
            <Users color="#f59e0b" size={48} />
            <Text style={styles.emptyTitle}>Member List Restricted</Text>
            <Text style={styles.emptyText}>You can only view your own profile</Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {getFilteredMembers().length === 0 ? (
              <View style={styles.emptyState}>
                <Users color="#ccc" size={48} />
                <Text style={styles.emptyTitle}>No members found</Text>
                <Text style={styles.emptyText}>Add members to get started</Text>
              </View>
            ) : (
              getFilteredMembers().map((member, index) => (
                <View 
                  key={member.id} 
                  style={[styles.memberCardWrapper, { zIndex: getFilteredMembers().length - index }]}
                >
                  <TouchableOpacity 
                    style={styles.memberCard}
                    onPress={() => router.push(`/member-details?memberId=${member.id}`)}
                  >
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitial}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberDetails}>
                      <View style={styles.memberHeader}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        {getRoleIcon(member.role)}
                      </View>
                      <Text style={styles.memberContact}>
                        {member.email || member.phoneNumber || 'No contact info'}
                      </Text>
                      <View style={styles.memberMeta}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: `${getStatusColor(member.status)}20` },
                          ]}
                        >
                          <Text style={[styles.statusText, { color: getStatusColor(member.status) }]}>
                            {member.status}
                          </Text>
                        </View>
                        <Text style={styles.joinDate}>
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      showMemberActions(member);
                    }}
                  >
                    <MoreVertical color="#666" size={20} />
                  </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerInfo: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#333',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  activeTabText: {
    color: '#667eea',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  membersList: {
    gap: 12,
    paddingBottom: 20,
  },
  memberCardWrapper: {
    position: 'relative',
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  memberInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  memberDetails: {
    flex: 1,
    gap: 6,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  memberContact: {
    fontSize: 14,
    color: '#666',
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
  },
  menuButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },

  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});