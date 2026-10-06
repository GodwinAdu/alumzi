import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Target, Calendar, DollarSign, Users, Heart, Share, CreditCard } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { apiService } from '@/services/api';

type Fundraiser = {
  id: string;
  type: 'goal' | 'contribution';
  title: string;
  description: string;
  targetAmount?: number;
  currentAmount: number;
  deadline: string;
  status: 'active' | 'completed' | 'expired';
  createdBy: string;
  createdAt: string;
  contributors: Array<{
    id: string;
    name: string;
    amount: number;
    date: string;
    message?: string;
  }>;
};

export default function FundraiserDetailsPage() {
  const router = useRouter();
  const { fundraiserId, associationId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const { user } = useAuth();
  const selectedAssociation = userAssociations?.find(assoc => assoc.id === associationId);
  const currencySymbol = getCurrencySymbol(selectedAssociation?.currency || 'USD');

  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeMessage, setContributeMessage] = useState('');
  const [isContributing, setIsContributing] = useState(false);

  useEffect(() => {
    loadFundraiser();
  }, [fundraiserId]);

  const loadFundraiser = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFundraiser(fundraiserId as string);
      setFundraiser(response.fundraiser);
    } catch (error) {
      Alert.alert('Error', 'Failed to load fundraiser details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async () => {
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsContributing(true);
    try {
      await apiService.contributeFundraiser(fundraiserId as string, {
        amount: parseFloat(contributeAmount),
        message: contributeMessage.trim() || undefined,
        contributorId: user?.id || ''
      });

      Alert.alert('Success', 'Thank you for your contribution!', [
        { text: 'OK', onPress: () => {
          setShowContributeModal(false);
          setContributeAmount('');
          setContributeMessage('');
          loadFundraiser();
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to process contribution');
    } finally {
      setIsContributing(false);
    }
  };

  const getProgressPercentage = () => {
    if (!fundraiser || fundraiser.type === 'contribution') return 0;
    return Math.min((fundraiser.currentAmount / (fundraiser.targetAmount || 1)) * 100, 100);
  };

  const getDaysRemaining = () => {
    if (!fundraiser) return 0;
    const deadline = new Date(fundraiser.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusColor = () => {
    if (!fundraiser) return '#666';
    switch (fundraiser.status) {
      case 'active': return '#10b981';
      case 'completed': return '#667eea';
      case 'expired': return '#ef4444';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading fundraiser details...</Text>
        </View>
      </View>
    );
  }

  if (!fundraiser) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Not Found' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Fundraiser not found</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: fundraiser.title,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#667eea', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        )
      }} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.typeIndicator}>
            {fundraiser.type === 'goal' ? (
              <Target color="#667eea" size={20} />
            ) : (
              <Users color="#667eea" size={20} />
            )}
            <Text style={styles.typeText}>
              {fundraiser.type === 'goal' ? 'Goal Fund' : 'Contribution'}
            </Text>
          </View>
          
          <Text style={styles.title}>{fundraiser.title}</Text>
          <Text style={styles.description}>{fundraiser.description}</Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{fundraiser.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.deadline}>
              <Calendar color="#f59e0b" size={16} />
              {' '}{getDaysRemaining()} days left
            </Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.currentAmount}>
              {currencySymbol}{fundraiser.currentAmount.toLocaleString()}
            </Text>
            {fundraiser.type === 'goal' && (
              <Text style={styles.targetAmount}>
                of {currencySymbol}{fundraiser.targetAmount?.toLocaleString()} goal
              </Text>
            )}
          </View>
          
          {fundraiser.type === 'goal' && (
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} 
                />
              </View>
              <Text style={styles.progressPercentage}>
                {getProgressPercentage().toFixed(1)}%
              </Text>
            </View>
          )}
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{fundraiser.contributors.length}</Text>
              <Text style={styles.statLabel}>Contributors</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {currencySymbol}{(fundraiser.currentAmount / Math.max(fundraiser.contributors.length, 1)).toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Avg. Contribution</Text>
            </View>
          </View>
        </View>

        {fundraiser.status === 'active' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.contributeButton}
              onPress={() => setShowContributeModal(true)}
            >
              <Heart color="#fff" size={20} />
              <Text style={styles.contributeButtonText}>Contribute Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareButton}>
              <Share color="#667eea" size={20} />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.contributorsSection}>
          <Text style={styles.sectionTitle}>Contributors ({fundraiser.contributors.length})</Text>
          
          {fundraiser.contributors.length === 0 ? (
            <View style={styles.noContributors}>
              <Text style={styles.noContributorsText}>No contributions yet. Be the first to contribute!</Text>
            </View>
          ) : (
            fundraiser.contributors.map((contributor, index) => (
              <View key={index} style={styles.contributorCard}>
                <View style={styles.contributorInfo}>
                  <Text style={styles.contributorName}>{contributor.name}</Text>
                  <Text style={styles.contributorDate}>
                    {new Date(contributor.date).toLocaleDateString()}
                  </Text>
                  {contributor.message && (
                    <Text style={styles.contributorMessage}>"{contributor.message}"</Text>
                  )}
                </View>
                <Text style={styles.contributorAmount}>
                  {currencySymbol}{contributor.amount.toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showContributeModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowContributeModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Make a Contribution</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalCampaignInfo}>
              <Text style={styles.modalCampaignTitle}>{fundraiser.title}</Text>
              <Text style={styles.modalCampaignProgress}>
                {currencySymbol}{fundraiser.currentAmount.toLocaleString()} raised
                {fundraiser.type === 'goal' && ` of ${currencySymbol}${fundraiser.targetAmount?.toLocaleString()}`}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contribution Amount *</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  value={contributeAmount}
                  onChangeText={setContributeAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Leave a message of support..."
                value={contributeMessage}
                onChangeText={setContributeMessage}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (!contributeAmount || isContributing) && styles.submitButtonDisabled]}
              onPress={handleContribute}
              disabled={!contributeAmount || isContributing}
            >
              <CreditCard color="#fff" size={20} />
              <Text style={styles.submitButtonText}>
                {isContributing ? 'Processing...' : 'Contribute Now'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  header: {
    marginBottom: 24,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  typeText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600' as const,
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
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  deadline: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600' as const,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  progressHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  currentAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#10b981',
  },
  targetAmount: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  contributeButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  contributeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  shareButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  shareButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  contributorsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  noContributors: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  noContributorsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  contributorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  contributorDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  contributorMessage: {
    fontSize: 14,
    color: '#667eea',
    fontStyle: 'italic',
    marginTop: 4,
  },
  contributorAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  modalCampaignInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  modalCampaignTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modalCampaignProgress: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600' as const,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});