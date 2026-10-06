import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Settings, DollarSign, UserPlus, MoreVertical, Shield, UserMinus, ChevronDown, Edit2, Camera, X, Check, Calendar, BarChart3, Megaphone } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function GroupInfoScreen() {
  const router = useRouter();
  const { groupId, groupName, communityId } = useLocalSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => api.getGroupMembers(groupId as string),
    enabled: !!groupId,
  });

  const members = membersData?.members || [];
  const currentMember = members.find((m: any) => m.userId === user?.id);
  const isAdmin = currentMember?.role === 'admin';

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => api.removeGroupMember(groupId as string, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
      setShowMemberMenu(false);
      Alert.alert('Success', 'Member removed');
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (memberId: string) => api.promoteToAdmin(groupId as string, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
      setShowMemberMenu(false);
      Alert.alert('Success', 'Member promoted to admin');
    },
  });

  const demoteMutation = useMutation({
    mutationFn: (memberId: string) => api.demoteFromAdmin(groupId as string, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
      setShowMemberMenu(false);
      Alert.alert('Success', 'Member demoted');
    },
  });

  const updateInfoMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string; avatar?: string }) => 
      api.updateGroupInfo(groupId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
      setEditMode(false);
      Alert.alert('Success', 'Group updated');
    },
  });

  const handleMemberAction = (member: any, action: string) => {
    if (action === 'remove') {
      Alert.alert('Remove Member', `Remove ${member.name} from group?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeMutation.mutate(member.userId) },
      ]);
    } else if (action === 'promote') {
      promoteMutation.mutate(member.userId);
    } else if (action === 'demote') {
      demoteMutation.mutate(member.userId);
    }
  };

  const handleEditGroup = () => {
    setEditName(groupName?.toString() || '');
    setEditDescription('');
    setEditAvatar('');
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    const updates: any = {};
    if (editName !== groupName) updates.name = editName;
    if (editDescription) updates.description = editDescription;
    if (editAvatar) updates.avatar = editAvatar;
    
    if (Object.keys(updates).length > 0) {
      updateInfoMutation.mutate(updates);
    } else {
      setEditMode(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setEditAvatar(result.assets[0].uri);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Info</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Info</Text>
        {isAdmin && !editMode && (
          <TouchableOpacity onPress={handleEditGroup} style={styles.editButton}>
            <Edit2 color="#fff" size={20} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {editMode ? (
          <View style={styles.editContainer}>
            <Text style={styles.editLabel}>Group Avatar</Text>
            <TouchableOpacity style={styles.avatarPicker} onPress={handlePickImage}>
              {editAvatar ? (
                <Image source={{ uri: editAvatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.groupIcon}>
                  <Camera color="#fff" size={32} />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.editLabel}>Group Name</Text>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter group name"
            />

            <Text style={styles.editLabel}>Description</Text>
            <TextInput
              style={[styles.editInput, styles.editTextArea]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Enter group description"
              multiline
              numberOfLines={4}
            />

            <View style={styles.editActions}>
              <TouchableOpacity 
                style={[styles.editActionButton, styles.cancelButton]} 
                onPress={() => setEditMode(false)}
              >
                <X color="#666" size={20} />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.editActionButton, styles.saveButton]} 
                onPress={handleSaveEdit}
              >
                <Check color="#fff" size={20} />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.groupHeader}>
            <View style={styles.groupIcon}>
              <Text style={styles.groupIconText}>{groupName?.toString().charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.groupName}>{groupName}</Text>
            <Text style={styles.memberCount}>{members.length} members</Text>
          </View>
        )}

        <View style={styles.actions}>
          {isAdmin && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push(`/add-group-members?groupId=${groupId}&communityId=${communityId}`)}
            >
              <UserPlus color="#667eea" size={20} />
              <Text style={styles.actionText}>Add Members</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/group-financial-dashboard?groupId=${groupId}&groupName=${groupName}`)}
          >
            <DollarSign color="#667eea" size={20} />
            <Text style={styles.actionText}>Finances</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/group-settings?groupId=${groupId}&groupName=${groupName}`)}
          >
            <Settings color="#667eea" size={20} />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>Organization Tools</Text>
          <TouchableOpacity 
            style={styles.toolButton}
            onPress={() => router.push(`/group-events?groupId=${groupId}&groupName=${groupName}`)}
          >
            <Calendar color="#667eea" size={20} />
            <Text style={styles.toolText}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolButton}
            onPress={() => router.push(`/group-polls?groupId=${groupId}&groupName=${groupName}`)}
          >
            <BarChart3 color="#667eea" size={20} />
            <Text style={styles.toolText}>Polls</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolButton}
            onPress={() => router.push(`/group-announcements?groupId=${groupId}&groupName=${groupName}`)}
          >
            <Megaphone color="#667eea" size={20} />
            <Text style={styles.toolText}>Announcements</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          {members.map((member: any) => (
            <TouchableOpacity 
              key={member.id} 
              style={styles.memberItem}
              onPress={() => isAdmin && member.userId !== user?.id && (setSelectedMember(member), setShowMemberMenu(true))}
              disabled={!isAdmin || member.userId === user?.id}
            >
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{member.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                {member.role === 'admin' && (
                  <Text style={styles.memberRole}>Group Admin</Text>
                )}
              </View>
              {isAdmin && member.userId !== user?.id && (
                <MoreVertical color="#999" size={20} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showMemberMenu} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMemberMenu(false)}
        >
          <View style={styles.memberMenu}>
            <Text style={styles.menuTitle}>{selectedMember?.name}</Text>
            {selectedMember?.role === 'member' ? (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMemberAction(selectedMember, 'promote')}
              >
                <Shield color="#667eea" size={20} />
                <Text style={styles.menuText}>Promote to Admin</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleMemberAction(selectedMember, 'demote')}
              >
                <ChevronDown color="#f59e0b" size={20} />
                <Text style={styles.menuText}>Demote to Member</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => handleMemberAction(selectedMember, 'remove')}
            >
              <UserMinus color="#ef4444" size={20} />
              <Text style={[styles.menuText, styles.menuTextDanger]}>Remove from Group</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  editButton: {
    marginLeft: 'auto',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  groupHeader: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  groupIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  groupIconText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#667eea',
  },
  toolsSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  toolText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#667eea',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  memberRole: {
    fontSize: 13,
    color: '#667eea',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 250,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600' as const,
  },
  menuTextDanger: {
    color: '#ef4444',
  },
  editContainer: {
    backgroundColor: '#fff',
    padding: 24,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 16,
  },
  avatarPicker: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  editTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  editActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#666',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
