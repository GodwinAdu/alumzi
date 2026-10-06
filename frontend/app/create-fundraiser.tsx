import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Target, Calendar, DollarSign, Users } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { apiService } from '@/services/api';

export default function CreateFundraiserPage() {
  const router = useRouter();
  const { associationId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const { user } = useAuth();
  const { limits } = useSubscription();
  const selectedAssociation = userAssociations?.find(assoc => assoc.id === associationId);
  const currencySymbol = getCurrencySymbol(selectedAssociation?.currency || 'USD');

  const [type, setType] = useState<'goal' | 'contribution'>('goal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !deadline) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (type === 'goal' && (!targetAmount || parseFloat(targetAmount) <= 0)) {
      Alert.alert('Error', 'Please enter a valid target amount for goal fundraiser');
      return;
    }

    if (!limits.hasPaymentProcessing) {
      Alert.alert(
        'Upgrade Required',
        'Fundraising campaigns are available on Pro and Enterprise plans.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/subscription-settings') }
        ]
      );
      return;
    }

    setIsCreating(true);
    try {
      await apiService.createFundraiser(selectedAssociation?.id || '', {
        type,
        title: title.trim(),
        description: description.trim(),
        targetAmount: type === 'goal' ? parseFloat(targetAmount) : undefined,
        deadline: new Date(deadline).toISOString(),
        createdBy: user?.id || ''
      });

      Alert.alert('Success', 'Fundraiser created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create fundraiser');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Create Fundraiser',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#667eea', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        )
      }} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Fundraiser</Text>
          <Text style={styles.subtitle}>{selectedAssociation?.name}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Campaign Type *</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'goal' && styles.typeButtonActive]}
                onPress={() => setType('goal')}
              >
                <Target color={type === 'goal' ? '#fff' : '#667eea'} size={20} />
                <Text style={[styles.typeButtonText, type === 'goal' && styles.typeButtonTextActive]}>
                  Goal Fund
                </Text>
                <Text style={[styles.typeButtonDesc, type === 'goal' && styles.typeButtonDescActive]}>
                  Fixed target amount
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.typeButton, type === 'contribution' && styles.typeButtonActive]}
                onPress={() => setType('contribution')}
              >
                <Users color={type === 'contribution' ? '#fff' : '#667eea'} size={20} />
                <Text style={[styles.typeButtonText, type === 'contribution' && styles.typeButtonTextActive]}>
                  Contribution
                </Text>
                <Text style={[styles.typeButtonDesc, type === 'contribution' && styles.typeButtonDescActive]}>
                  Open contributions
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Campaign Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Eric's Surgery Bills, Sarah's Wedding"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the purpose and details of this fundraiser..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {type === 'goal' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Amount *</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deadline *</Text>
            <View style={styles.dateContainer}>
              <Calendar color="#667eea" size={20} />
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                value={deadline}
                onChangeText={setDeadline}
              />
            </View>
            <Text style={styles.dateHint}>Format: YYYY-MM-DD (e.g., 2025-12-25)</Text>
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Preview</Text>
            <View style={styles.previewContent}>
              <Text style={styles.previewCampaignTitle}>{title || 'Campaign Title'}</Text>
              <Text style={styles.previewDescription}>{description || 'Campaign description will appear here...'}</Text>
              {type === 'goal' && (
                <Text style={styles.previewTarget}>
                  Target: {currencySymbol}{targetAmount || '0.00'}
                </Text>
              )}
              <Text style={styles.previewDeadline}>
                Deadline: {deadline || 'Not set'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createButton, (!title || !description || !deadline || isCreating) && styles.createButtonDisabled]}
            onPress={handleSubmit}
            disabled={!title || !description || !deadline || isCreating}
          >
            <Text style={styles.createButtonText}>
              {isCreating ? 'Creating...' : 'Create Fundraiser'}
            </Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  typeButtonDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  typeButtonDescActive: {
    color: '#e0e7ff',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    paddingLeft: 16,
    paddingRight: 8,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 16,
    color: '#1a1a1a',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  dateHint: {
    fontSize: 12,
    color: '#666',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  previewContent: {
    gap: 8,
  },
  previewCampaignTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  previewTarget: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  previewDeadline: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600' as const,
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});