import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Users, MessageCircle } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { api } from '@/lib/api';

interface Group {
  id: string;
  name: string;
  description?: string;
  type: string;
  icon?: string;
  memberCount: number;
  isMember: boolean;
  isMuted: boolean;
  role?: string;
  isDefault?: boolean;
  settings?: {
    onlyAdminsCanPost: boolean;
    requireApproval?: boolean;
    isPublic?: boolean;
  };
}

export default function CommunityGroupsScreen() {
  const router = useRouter();
  const { selectedAssociation } = useAssociation();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedAssociation?.id) {
      fetchGroups();
    }
  }, [selectedAssociation?.id]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { groups: fetchedGroups } = await api.getCommunityGroups(selectedAssociation?.id || '');
      setGroups(fetchedGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  const handleJoinGroup = async (groupId: string, groupName: string, requiresApproval?: boolean) => {
    try {
      const response = await api.joinGroup(groupId);
      if (response.requiresApproval) {
        alert(`Join request sent to ${groupName} admins`);
      } else {
        alert(`Joined ${groupName} successfully`);
      }
      fetchGroups();
    } catch (error: any) {
      alert(error.message || 'Failed to join group');
    }
  };

  const handleGroupPress = (group: Group) => {
    if (group.isMember) {
      router.push(`/group-chat?groupId=${group.id}&groupName=${group.name}&isDefault=${group.isDefault || false}`);
    } else {
      handleJoinGroup(group.id, group.name, group.settings?.requireApproval);
    }
  };

  const getGroupIcon = (type: string, icon?: string) => {
    if (icon) return icon;
    switch (type) {
      case 'announcement': return '📢';
      case 'finance': return '💰';
      case 'general': return '💬';
      case 'events': return '📅';
      default: return '👥';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{selectedAssociation?.name}</Text>
          <Text style={styles.headerSubtitle}>Community</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push(`/create-group?communityId=${selectedAssociation?.id}`)}
        >
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Groups</Text>
          
          {groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              onPress={() => handleGroupPress(group)}
            >
              <View style={styles.groupIcon}>
                <Text style={styles.groupIconText}>{getGroupIcon(group.type, group.icon)}</Text>
              </View>
              
              <View style={styles.groupInfo}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  {group.role === 'admin' && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>Admin</Text>
                    </View>
                  )}
                  {group.settings?.onlyAdminsCanPost && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin only</Text>
                    </View>
                  )}
                </View>
                
                {group.description && (
                  <Text style={styles.groupDescription} numberOfLines={1}>
                    {group.description}
                  </Text>
                )}
                
                <View style={styles.groupFooter}>
                  <Users color="#666" size={14} />
                  <Text style={styles.memberCount}>{group.memberCount} members</Text>
                </View>
              </View>

              <View style={styles.groupAction}>
                {group.isMember ? (
                  <View style={styles.actionButtons}>
                    {group.role === 'admin' && (
                      <TouchableOpacity
                        style={styles.requestsButton}
                        onPress={() => router.push(`/group-join-requests?groupId=${group.id}&groupName=${group.name}`)}
                      >
                        <Text style={styles.requestsButtonText}>Requests</Text>
                      </TouchableOpacity>
                    )}
                    <MessageCircle color="#667eea" size={24} />
                  </View>
                ) : (
                  <View style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>
                      {group.settings?.requireApproval ? 'Request' : 'Join'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  groupCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIconText: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  roleBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  adminBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '600' as const,
  },
  groupDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  groupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
  },
  groupAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestsButton: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  requestsButtonText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  joinButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
