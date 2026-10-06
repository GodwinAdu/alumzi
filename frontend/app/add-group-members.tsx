import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, Check } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AddGroupMembersScreen() {
  const router = useRouter();
  const { groupId, communityId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const { data: communityMembers } = useQuery({
    queryKey: ['communityMembers', communityId],
    queryFn: () => api.getAssociationMembers(communityId as string),
    enabled: !!communityId,
  });

  const { data: groupMembers } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => api.getGroupMembers(groupId as string),
    enabled: !!groupId,
  });

  const addMutation = useMutation({
    mutationFn: (memberIds: string[]) => api.addGroupMembers(groupId as string, memberIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
      Alert.alert('Success', 'Members added to group', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
  });

  const allMembers = communityMembers?.members || [];
  const existingMemberIds = (groupMembers?.members || []).map((m: any) => m.userId);
  const availableMembers = allMembers.filter((m: any) => {
    const memberId = m.userId || m.id;
    return !existingMemberIds.includes(memberId);
  });

  const filteredMembers = availableMembers.filter((m: any) =>
    m.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (memberId: string) => {
    setSelected(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleAdd = () => {
    if (selected.length === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }
    addMutation.mutate(selected);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Members</Text>
        <TouchableOpacity onPress={handleAdd} disabled={selected.length === 0 || addMutation.isPending}>
          <Text style={[styles.addButton, selected.length === 0 && styles.addButtonDisabled]}>
            Add ({selected.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search color="#999" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredMembers}
        keyExtractor={(item: any) => item.userId || item.id}
        renderItem={({ item }) => {
          const memberId = item.userId || item.id;
          return (
            <TouchableOpacity
              style={styles.memberItem}
              onPress={() => toggleSelect(memberId)}
            >
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberRole}>{item.role}</Text>
              </View>
              {selected.includes(memberId) && (
                <View style={styles.checkmark}>
                  <Check color="#fff" size={16} />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {search ? 'No members found' : 'All community members are already in this group'}
            </Text>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    flex: 1,
    marginLeft: 12,
  },
  addButton: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
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
    color: '#666',
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
