import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { UserPlus, Search, X, Check, AlertCircle } from 'lucide-react-native';
import * as Contacts from 'expo-contacts';
import { useAssociation } from '@/contexts/AssociationContext';
import { api } from '@/lib/api';

interface SelectedMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: 'contact' | 'manual';
  isRegistered?: boolean;
}

export default function AddMemberQuickPage() {
  const router = useRouter();
  const { associationId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.find(a => a.id === associationId) || userAssociations?.[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Manual entry fields
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = contacts.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phoneNumbers?.[0]?.number?.includes(searchQuery)
      );
      setFilteredContacts(filtered.slice(0, 20)); // Limit to 20 for performance
    } else {
      setFilteredContacts([]);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });
        
        const validContacts = data.filter(c => c.name && c.phoneNumbers?.length > 0);
        setContacts(validContacts);
      }
    } catch (error) {
      console.error('Load contacts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = async (contact: any) => {
    const phone = contact.phoneNumbers?.[0]?.number?.replace(/\s+/g, '').substring(0, 20);
    const email = contact.emails?.[0]?.email;

    // Check if already selected
    if (selectedMembers.some(m => m.phone === phone || m.email === email)) {
      Alert.alert('Already Selected', 'This contact is already in your list');
      return;
    }

    // Check if already a member
    try {
      const { contacts: statusContacts } = await api.checkExistingMembers(
        selectedAssociation?.id || '',
        [{ phoneNumber: phone }]
      );

      if (statusContacts[0]?.isExisting) {
        Alert.alert('Already Member', 'This person is already a member');
        return;
      }

      const newMember: SelectedMember = {
        id: `contact-${Date.now()}`,
        name: contact.name,
        email,
        phone,
        source: 'contact',
        isRegistered: statusContacts[0]?.isRegistered
      };

      setSelectedMembers([...selectedMembers, newMember]);
      setSearchQuery('');
    } catch (error) {
      console.error('Check member error:', error);
    }
  };

  const handleAddManual = () => {
    if (!manualName || (!manualEmail && !manualPhone)) {
      Alert.alert('Missing Info', 'Please provide name and either email or phone');
      return;
    }

    // Check duplicates
    if (selectedMembers.some(m => 
      m.email === manualEmail || m.phone === manualPhone
    )) {
      Alert.alert('Duplicate', 'This person is already in your list');
      return;
    }

    const newMember: SelectedMember = {
      id: `manual-${Date.now()}`,
      name: manualName,
      email: manualEmail || undefined,
      phone: manualPhone || undefined,
      source: 'manual'
    };

    setSelectedMembers([...selectedMembers, newMember]);
    setManualName('');
    setManualEmail('');
    setManualPhone('');
    setShowManualEntry(false);
  };

  const handleRemoveMember = (id: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== id));
  };

  const handleSubmit = async () => {
    if (selectedMembers.length === 0) {
      Alert.alert('No Members', 'Please add at least one member');
      return;
    }

    if (selectedMembers.length > 5) {
      Alert.alert('Too Many', 'Quick Add supports up to 5 members. Use Bulk Import for more.');
      return;
    }

    try {
      setSubmitting(true);

      const registeredMembers = selectedMembers
        .filter(m => m.isRegistered)
        .map(m => ({
          name: m.name,
          email: m.email || '',
          phoneNumber: m.phone || '',
          role: 'member'
        }));

      const guestMembers = selectedMembers
        .filter(m => !m.isRegistered)
        .map(m => ({
          name: m.name,
          email: m.email || '',
          phoneNumber: m.phone || '',
          role: 'member'
        }));

      const { results } = await api.addMembers(
        selectedAssociation?.id || '',
        registeredMembers,
        guestMembers
      );

      const added = results.filter((r: any) => r.status === 'added').length;
      Alert.alert('Success', `${added} member(s) added successfully`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add members');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Quick Add Members' }} />
      <View style={styles.container}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Search Contacts */}
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>Search Contacts</Text>
            <View style={styles.searchBox}>
              <Search color="#999" size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Type name or phone number..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
            </View>

            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#667eea" />
                <Text style={styles.loadingText}>Loading contacts...</Text>
              </View>
            )}

            {searchQuery && filteredContacts.length > 0 && (
              <View style={styles.contactResults}>
                {filteredContacts.map((contact, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.contactItem}
                    onPress={() => handleSelectContact(contact)}
                  >
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactAvatarText}>
                        {contact.name?.charAt(0)?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactDetails}>
                        {contact.phoneNumbers?.[0]?.number}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Manual Entry */}
          {!showManualEntry ? (
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => setShowManualEntry(true)}
            >
              <UserPlus color="#667eea" size={20} />
              <Text style={styles.manualButtonText}>Add Manually</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.manualSection}>
              <View style={styles.manualHeader}>
                <Text style={styles.sectionTitle}>Manual Entry</Text>
                <TouchableOpacity onPress={() => setShowManualEntry(false)}>
                  <X color="#999" size={20} />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                value={manualName}
                onChangeText={setManualName}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={manualEmail}
                onChangeText={setManualEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={manualPhone}
                onChangeText={setManualPhone}
                keyboardType="phone-pad"
              />
              
              <TouchableOpacity
                style={[styles.addButton, (!manualName || (!manualEmail && !manualPhone)) && styles.addButtonDisabled]}
                onPress={handleAddManual}
                disabled={!manualName || (!manualEmail && !manualPhone)}
              >
                <Text style={styles.addButtonText}>Add to List</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.sectionTitle}>
                Selected Members ({selectedMembers.length}/5)
              </Text>
              
              {selectedMembers.map((member) => (
                <View key={member.id} style={styles.selectedItem}>
                  <View style={styles.selectedAvatar}>
                    <Text style={styles.selectedAvatarText}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedName}>{member.name}</Text>
                    <Text style={styles.selectedDetails}>
                      {member.phone || member.email}
                    </Text>
                    {!member.isRegistered && (
                      <View style={styles.guestBadge}>
                        <AlertCircle color="#f59e0b" size={12} />
                        <Text style={styles.guestBadgeText}>Guest Member</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveMember(member.id)}>
                    <X color="#ff4757" size={20} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Submit Button */}
        {selectedMembers.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check color="#fff" size={20} />
                  <Text style={styles.submitButtonText}>
                    Add {selectedMembers.length} Member{selectedMembers.length !== 1 ? 's' : ''}
                  </Text>
                </>
              )}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  searchSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  contactResults: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  contactDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  manualSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  manualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedSection: {
    marginBottom: 24,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  selectedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  selectedDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  guestBadgeText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
