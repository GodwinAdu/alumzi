import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, Trash2 } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function BookmarksScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.getUserBookmarks(),
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: (messageId: string) => api.removeBookmark(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const renderBookmark = ({ item }: any) => (
    <View style={styles.bookmarkCard}>
      <View style={styles.bookmarkHeader}>
        <Bookmark color="#667eea" size={20} fill="#667eea" />
        <Text style={styles.groupName}>{item.groupId?.name}</Text>
      </View>
      <Text style={styles.messageText}>{item.messageId?.text}</Text>
      {item.note && <Text style={styles.note}>Note: {item.note}</Text>}
      <View style={styles.bookmarkFooter}>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <TouchableOpacity
          onPress={() => removeBookmarkMutation.mutate(item.messageId._id)}
        >
          <Trash2 color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookmarks</Text>
      </View>

      <FlatList
        data={data?.bookmarks || []}
        renderItem={renderBookmark}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bookmark color="#ccc" size={48} />
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading...' : 'No bookmarks yet'}
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#667eea',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  bookmarkCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#667eea',
  },
  messageText: {
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  note: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  bookmarkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
