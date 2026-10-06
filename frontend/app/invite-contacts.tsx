import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Share, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { Users, Share2, Check } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useAssociation } from '@/contexts/AssociationContext';

type Contact = {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
};

export default function InviteContactsPage() {
  const router = useRouter();
  const { associationId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.find(assoc => assoc.id === associationId);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      // For now, use empty contacts since backend endpoint doesn't exist
      setContacts([]);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const sendInvitations = async () => {
    if (selectedContacts.length === 0) return;

    setIsSending(true);
    try {
      // For now, just show success since backend doesn't support this yet
      Alert.alert(
        'Feature Coming Soon',
        'Contact invitations will be available in a future update. For now, please share the invite link.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitations. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const shareInviteLink = async () => {
    try {
      const linkData = await apiService.generateInviteLink(associationId as string);
      const message = `Join ${selectedAssociation?.name} on our app!\n\nUse code: ${selectedAssociation?.code}\nOr click: ${linkData.link}`;
      
      await Share.share({
        message,
        title: `Join ${selectedAssociation?.name}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invite link.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Invite Members',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
            <Text style={{ color: '#667eea', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        )
      }} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Invite to {selectedAssociation?.name}</Text>
          <Text style={styles.description}>
            Select contacts from your phone to invite them to join
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareButton} onPress={shareInviteLink}>
            <Share2 color="#667eea" size={20} />
            <Text style={styles.shareButtonText}>Share Invite Link</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.contactsList}>
          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading contacts...</Text>
            </View>
          ) : contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Users color="#ccc" size={48} />
              <Text style={styles.emptyText}>No contacts found</Text>
              <Text style={styles.emptySubtext}>
                Make sure you have contacts in your phone
              </Text>
            </View>
          ) : (
            contacts.map(contact => (
              <TouchableOpacity
                key={contact.id}
                style={[
                  styles.contactItem,
                  selectedContacts.includes(contact.id) && styles.contactItemSelected
                ]}
                onPress={() => toggleContact(contact.id)}
              >
                <View style={styles.contactInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {contact.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contactDetails}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactContact}>
                      {contact.email || contact.phoneNumber}
                    </Text>
                  </View>
                </View>
                {selectedContacts.includes(contact.id) && (
                  <Check color="#667eea" size={20} />
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {selectedContacts.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.inviteButton, isSending && styles.buttonDisabled]}
              onPress={sendInvitations}
              disabled={isSending}
            >
              <Text style={styles.inviteButtonText}>
                {isSending 
                  ? 'Sending...' 
                  : `Invite ${selectedContacts.length} Contact${selectedContacts.length > 1 ? 's' : ''}`
                }
              </Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  shareButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#667eea',
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contactItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contactItemSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  contactContact: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    paddingTop: 16,
  },
  inviteButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});