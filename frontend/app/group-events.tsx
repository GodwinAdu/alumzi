import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, Plus } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function GroupEventsScreen() {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: eventsData } = useQuery({
    queryKey: ['groupEvents', groupId],
    queryFn: () => api.getGroupEvents(groupId as string),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createEvent(groupId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupEvents', groupId] });
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setLocation('');
      Alert.alert('Success', 'Event created');
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ eventId, status }: any) => api.respondToEvent(eventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupEvents', groupId] });
    },
  });

  const handleCreate = () => {
    if (!title || !startDate) {
      Alert.alert('Error', 'Title and date are required');
      return;
    }
    createMutation.mutate({ title, description, location, startDate: startDate.toISOString() });
  };

  const events = eventsData?.events || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity onPress={() => setShowCreate(!showCreate)}>
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showCreate && (
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>Create Event</Text>
            <TextInput
              style={styles.input}
              placeholder="Event title"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Location"
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Calendar color="#667eea" size={20} />
              <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime"
                onChange={(e, date) => {
                  setShowDatePicker(false);
                  if (date) setStartDate(date);
                }}
              />
            )}
            <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
              <Text style={styles.createButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        )}

        {events.map((event: any) => (
          <View key={event._id} style={styles.eventCard}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            {event.description && <Text style={styles.eventDesc}>{event.description}</Text>}
            <View style={styles.eventMeta}>
              <Calendar color="#666" size={16} />
              <Text style={styles.eventMetaText}>{new Date(event.startDate).toLocaleString()}</Text>
            </View>
            {event.location && (
              <View style={styles.eventMeta}>
                <MapPin color="#666" size={16} />
                <Text style={styles.eventMetaText}>{event.location}</Text>
              </View>
            )}
            <View style={styles.responseButtons}>
              <TouchableOpacity
                style={[styles.responseButton, styles.goingButton]}
                onPress={() => respondMutation.mutate({ eventId: event._id, status: 'going' })}
              >
                <Text style={styles.responseButtonText}>Going</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.responseButton, styles.maybeButton]}
                onPress={() => respondMutation.mutate({ eventId: event._id, status: 'maybe' })}
              >
                <Text style={styles.responseButtonText}>Maybe</Text>
              </TouchableOpacity>
            </View>
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
  textArea: { height: 80, textAlignVertical: 'top' },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8, marginBottom: 12 },
  dateText: { fontSize: 15, color: '#1a1a1a' },
  createButton: { backgroundColor: '#667eea', padding: 14, borderRadius: 8, alignItems: 'center' },
  createButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' as const },
  eventCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 16, borderRadius: 12 },
  eventTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 8 },
  eventDesc: { fontSize: 14, color: '#666', marginBottom: 12 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  eventMetaText: { fontSize: 14, color: '#666' },
  responseButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  responseButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  goingButton: { backgroundColor: '#10b981' },
  maybeButton: { backgroundColor: '#f59e0b' },
  responseButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' as const },
});
