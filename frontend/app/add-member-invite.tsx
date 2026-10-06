import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Send, Mail, MessageSquare, X, Plus, CheckCircle } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { api } from '@/lib/api';

interface Invitation {
  name: string;
  email?: string;
  phone?: string;
  method: 'email' | 'sms';
}

export default function AddMemberInvitePage() {
  const router = useRouter();
  const { associationId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.find(a => a.id === associationId) || userAssociations?.[0];

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<'email' | 'sms'>('email');
  const [sending, setSending] = useState(false);
  const [sentInvitations, setSentInvitations] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (showHistory) {
      loadInvitationHistory();
    }
  }, [showHistory]);

  const loadInvitationHistory = async () => {
    try {
      const response = await fetch(`${api.baseURL}/member-management/invitations/${selectedAssociation?.id}`, {
        headers: {
          'Authorization': `Bearer ${await api.getToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSentInvitations(data.invitations);
      }
    } catch (error) {
      console.error('Load invitations error:', error);
    }
  };

  const handleAddInvitation = () => {
    if (!name || (method === 'email' && !email) || (method === 'sms' && !phone)) {
      Alert.alert('Missing Info', 'Please fill all required fields');
      return;
    }

    const invitation: Invitation = {
      name,
      email: method === 'email' ? email : undefined,
      phone: method === 'sms' ? phone : undefined,
      method,
    };

    setInvitations([...invitations, invitation]);
    setName('');
    setEmail('');
    setPhone('');
  };

  const handleRemoveInvitation = (index: number) => {
    setInvitations(invitations.filter((_, i) => i !== index));
  };

  const handleSendInvitations = async () => {
    if (invitations.length === 0) {
      Alert.alert('No Invitations', 'Please add at least one invitation');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${api.baseURL}/member-management/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await api.getToken()}`,
        },
        body: JSON.stringify({
          associationId: selectedAssociation?.id,
          invitations,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert(
          'Invitations Sent',
          `${invitations.length} invitation(s) sent successfully`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to send invitations');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitations');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Send Invitations' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Send color="#f59e0b" size={48} />
          <Text style={styles.title}>Send Invitations</Text>
          <Text style={styles.subtitle}>Invite members via email or SMS</Text>
        </View>

        {!showHistory ? (
          <>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <View style={styles.methodSelector}>
                <TouchableOpacity
                  style={[styles.methodButton, method === 'email' && styles.methodButtonActive]}
                  onPress={() => setMethod('email')}
                >
                  <Mail color={method === 'email' ? '#f59e0b' : '#666'} size={20} />
                  <Text style={[styles.methodText, method === 'email' && styles.methodTextActive]}>
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, method === 'sms' && styles.methodButtonActive]}
                  onPress={() => setMethod('sms')}
                >
                  <MessageSquare color={method === 'sms' ? '#f59e0b' : '#666'} size={20} />
                  <Text style={[styles.methodText, method === 'sms' && styles.methodTextActive]}>
                    SMS
                  </Text>
                </TouchableOpacity>
              </View>

              {method === 'email' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Email Address *"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number *"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              )}

              <TouchableOpacity
                style={[styles.addButton, (!name || (method === 'email' && !email) || (method === 'sms' && !phone)) && styles.addButtonDisabled]}
                onPress={handleAddInvitation}
                disabled={!name || (method === 'email' && !email) || (method === 'sms' && !phone)}
              >
                <Plus color="#fff" size={20} />
                <Text style={styles.addButtonText}>Add to List</Text>
              </TouchableOpacity>
            </View>

            {invitations.length > 0 && (
              <View style={styles.invitationsList}>
                <Text style={styles.listTitle}>Invitations ({invitations.length})</Text>
                {invitations.map((inv, index) => (
                  <View key={index} style={styles.invitationItem}>
                    <View style={styles.invitationIcon}>
                      {inv.method === 'email' ? (
                        <Mail color="#f59e0b" size={20} />
                      ) : (
                        <MessageSquare color="#f59e0b" size={20} />
                      )}
                    </View>
                    <View style={styles.invitationInfo}>
                      <Text style={styles.invitationName}>{inv.name}</Text>
                      <Text style={styles.invitationContact}>
                        {inv.email || inv.phone}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveInvitation(index)}>
                      <X color="#ef4444" size={20} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {invitations.length > 0 && (
              <TouchableOpacity
                style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                onPress={handleSendInvitations}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Send color="#fff" size={20} />
                    <Text style={styles.sendButtonText}>
                      Send {invitations.length} Invitation{invitations.length !== 1 ? 's' : ''}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => setShowHistory(true)}
            >
              <Text style={styles.historyButtonText}>View Invitation History</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.historyList}>
              <Text style={styles.listTitle}>Recent Invitations</Text>
              {sentInvitations.length === 0 ? (
                <Text style={styles.emptyText}>No invitations sent yet</Text>
              ) : (
                sentInvitations.map((inv, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyIcon}>
                      {inv.status === 'accepted' ? (
                        <CheckCircle color="#10b981" size={20} />
                      ) : (
                        <Send color="#f59e0b" size={20} />
                      )}
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyName}>{inv.inviteeName}</Text>
                      <Text style={styles.historyContact}>
                        {inv.inviteeEmail || inv.inviteePhone}
                      </Text>
                      <Text style={styles.historyStatus}>
                        {inv.status === 'accepted' ? 'Accepted' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowHistory(false)}
            >
              <Text style={styles.backButtonText}>Back to Send</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  methodButtonActive: {
    backgroundColor: '#fff5e6',
    borderColor: '#f59e0b',
  },
  methodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  methodTextActive: {
    color: '#f59e0b',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  invitationsList: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  invitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  invitationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitationInfo: {
    flex: 1,
  },
  invitationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  invitationContact: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  historyButton: {
    padding: 16,
    alignItems: 'center',
  },
  historyButtonText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  historyList: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  historyContact: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  historyStatus: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  backButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
