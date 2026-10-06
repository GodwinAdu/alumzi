import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Pin } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function GroupAnnouncementsScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: announcementsData } = useQuery({
    queryKey: ['groupAnnouncements', groupId],
    queryFn: () => api.getGroupAnnouncements(groupId as string),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createAnnouncement(groupId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupAnnouncements', groupId] });
      setShowCreate(false);
      setTitle('');
      setContent('');
      Alert.alert('Success', 'Announcement created');
    },
  });

  const handleCreate = () => {
    if (!title || !content) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }
    createMutation.mutate({ title, content });
  };

  const announcements = announcementsData?.announcements || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <TouchableOpacity onPress={() => setShowCreate(!showCreate)}>
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showCreate && (
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>Create Announcement</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Content"
              value={content}
              onChangeText={setContent}
              multiline
            />
            <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
              <Text style={styles.createButtonText}>Post Announcement</Text>
            </TouchableOpacity>
          </View>
        )}

        {announcements.map((announcement: any) => (
          <View key={announcement._id} style={styles.announcementCard}>
            {announcement.isPinned && (
              <View style={styles.pinnedBadge}>
                <Pin color="#667eea" size={14} />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}
            <Text style={styles.announcementTitle}>{announcement.title}</Text>
            <Text style={styles.announcementContent}>{announcement.content}</Text>
            <Text style={styles.announcementDate}>
              {new Date(announcement.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#667eea', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700' as const, color: '#fff' },
  content: { flex: 1 },
  createCard: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  createTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 16 },
  input: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  textArea: { height: 100, textAlignVertical: 'top' },
  createButton: { backgroundColor: '#667eea', padding: 14, borderRadius: 8, alignItems: 'center' },
  createButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' as const },
  announcementCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 16, borderRadius: 12 },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  pinnedText: { fontSize: 12, color: '#667eea', fontWeight: '600' as const },
  announcementTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 8 },
  announcementContent: { fontSize: 14, color: '#1a1a1a', marginBottom: 12, lineHeight: 20 },
  announcementDate: { fontSize: 12, color: '#999' },
});
