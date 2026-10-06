import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, X } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function GroupPollsScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const { data: pollsData } = useQuery({
    queryKey: ['groupPolls', groupId],
    queryFn: () => api.getGroupPolls(groupId as string),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createPoll(groupId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupPolls', groupId] });
      setShowCreate(false);
      setQuestion('');
      setOptions(['', '']);
      Alert.alert('Success', 'Poll created');
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionIndex }: any) => api.votePoll(pollId, optionIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupPolls', groupId] });
    },
  });

  const handleCreate = () => {
    const validOptions = options.filter(o => o.trim());
    if (!question || validOptions.length < 2) {
      Alert.alert('Error', 'Question and at least 2 options required');
      return;
    }
    createMutation.mutate({ question, options: validOptions });
  };

  const polls = pollsData?.polls || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Polls</Text>
        <TouchableOpacity onPress={() => setShowCreate(!showCreate)}>
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showCreate && (
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>Create Poll</Text>
            <TextInput
              style={styles.input}
              placeholder="Poll question"
              value={question}
              onChangeText={setQuestion}
            />
            {options.map((opt, i) => (
              <View key={i} style={styles.optionRow}>
                <TextInput
                  style={[styles.input, styles.optionInput]}
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChangeText={(text) => {
                    const newOpts = [...options];
                    newOpts[i] = text;
                    setOptions(newOpts);
                  }}
                />
                {i > 1 && (
                  <TouchableOpacity onPress={() => setOptions(options.filter((_, idx) => idx !== i))}>
                    <X color="#ef4444" size={20} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addOption} onPress={() => setOptions([...options, ''])}>
              <Text style={styles.addOptionText}>+ Add Option</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
              <Text style={styles.createButtonText}>Create Poll</Text>
            </TouchableOpacity>
          </View>
        )}

        {polls.map((poll: any) => (
          <View key={poll._id} style={styles.pollCard}>
            <Text style={styles.pollQuestion}>{poll.question}</Text>
            {poll.options.map((opt: any, i: number) => {
              const total = poll.options.reduce((sum: number, o: any) => sum + o.votes.length, 0);
              const percent = total > 0 ? Math.round((opt.votes.length / total) * 100) : 0;
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.pollOption}
                  onPress={() => voteMutation.mutate({ pollId: poll._id, optionIndex: i })}
                >
                  <View style={[styles.pollBar, { width: `${percent}%` }]} />
                  <Text style={styles.pollOptionText}>{opt.text}</Text>
                  <Text style={styles.pollPercent}>{percent}%</Text>
                </TouchableOpacity>
              );
            })}
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
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionInput: { flex: 1 },
  addOption: { padding: 12, alignItems: 'center' },
  addOptionText: { color: '#667eea', fontSize: 14, fontWeight: '600' as const },
  createButton: { backgroundColor: '#667eea', padding: 14, borderRadius: 8, alignItems: 'center' },
  createButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' as const },
  pollCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 16, borderRadius: 12 },
  pollQuestion: { fontSize: 16, fontWeight: '700' as const, marginBottom: 16 },
  pollOption: { position: 'relative', padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8, marginBottom: 8, overflow: 'hidden' },
  pollBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#e0e7ff' },
  pollOptionText: { fontSize: 14, fontWeight: '600' as const, zIndex: 1 },
  pollPercent: { position: 'absolute', right: 12, fontSize: 14, fontWeight: '600' as const, color: '#667eea', zIndex: 1 },
});
