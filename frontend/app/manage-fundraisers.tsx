import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Plus, Target, Users, Calendar, DollarSign, Edit3, Trash2, Eye } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
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
  contributorsCount: number;
  createdAt: string;
};

export default function ManageFundraisersPage() {
  const router = useRouter();
  const { associationId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const { user } = useAuth();
  const { limits } = useSubscription();
  const selectedAssociation = userAssociations?.find(assoc => assoc.id === associationId);
  const currencySymbol = getCurrencySymbol(selectedAssociation?.currency || 'USD');

  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all');

  useEffect(() => {
    loadFundraisers();
  }, [associationId, filter]);

  const loadFundraisers = async () => {
    try {
      setLoading(true);
      const response = await apiService.request(`/fundraisers/${associationId}/all?status=${filter === 'all' ? '' : filter}`);
      setFundraisers(response.fundraisers || []);
    } catch (error) {
      console.error('Error loading fundraisers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFundraisers();
  };

  const handleDelete = (fundraiser: Fundraiser) => {
    if (fundraiser.contributorsCount > 0) {
      Alert.alert('Cannot Delete', 'Fundraisers with contributions cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Fundraiser',
      `Are you sure you want to delete "${fundraiser.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteFundraiser(fundraiser.id);
              Alert.alert('Success', 'Fundraiser deleted successfully');
              loadFundraisers();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete fundraiser');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#667eea';
      case 'expired': return '#ef4444';
      default: return '#666';
    }
  };

  const getProgressPercentage = (fundraiser: Fundraiser) => {
    if (fundraiser.type === 'contribution' || !fundraiser.targetAmount) return 0;
    return Math.min((fundraiser.currentAmount / fundraiser.targetAmount) * 100, 100);
  };

  const getDaysRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const filteredFundraisers = fundraisers.filter(fundraiser => {
    if (filter === 'all') return true;
    return fundraiser.status === filter;
  });

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Manage Fundraisers',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#667eea', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push(`/create-fundraiser?associationId=${associationId}`)}>
            <Plus color="#667eea" size={24} />
          </TouchableOpacity>
        )
      }} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Fundraising Campaigns</Text>
          <Text style={styles.subtitle}>{selectedAssociation?.name}</Text>
        </View>

        {!limits.hasPaymentProcessing && (
          <View style={styles.upgradePrompt}>
            <Target color="#f59e0b" size={48} />
            <Text style={styles.upgradeTitle}>Fundraising - Pro Feature</Text>
            <Text style={styles.upgradeText}>
              Create fundraising campaigns and collect contributions with Pro or Enterprise plans
            </Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => router.push('/subscription-settings')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.filterTabs}>
          {(['all', 'active', 'completed', 'expired'] as const).map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterTab, filter === status && styles.filterTabActive]}
              onPress={() => setFilter(status)}
            >
              <Text style={[styles.filterTabText, filter === status && styles.filterTabTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          style={styles.fundraisersList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading fundraisers...</Text>
            </View>
          ) : filteredFundraisers.length === 0 ? (
            <View style={styles.emptyState}>
              <Target color="#ccc" size={48} />
              <Text style={styles.emptyTitle}>No Fundraisers</Text>
              <Text style={styles.emptyText}>
                {filter === 'all' 
                  ? 'Create your first fundraising campaign to start collecting contributions'
                  : `No ${filter} fundraisers found`
                }
              </Text>
              {limits.hasPaymentProcessing && (
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => router.push(`/create-fundraiser?associationId=${associationId}`)}
                >
                  <Plus color="#fff" size={20} />
                  <Text style={styles.createButtonText}>Create Fundraiser</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredFundraisers.map(fundraiser => (
              <View key={fundraiser.id} style={styles.fundraiserCard}>
                <View style={styles.fundraiserHeader}>
                  <View style={styles.fundraiserType}>
                    {fundraiser.type === 'goal' ? (
                      <Target color="#667eea" size={16} />
                    ) : (
                      <Users color="#667eea" size={16} />
                    )}
                    <Text style={styles.fundraiserTypeText}>
                      {fundraiser.type === 'goal' ? 'Goal Fund' : 'Contribution'}
                    </Text>
                  </View>
                  
                  <View style={styles.fundraiserActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => router.push(`/fundraiser-details?fundraiserId=${fundraiser.id}&associationId=${associationId}`)}
                    >
                      <Eye color="#667eea" size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(fundraiser)}
                    >
                      <Trash2 color="#ef4444" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.fundraiserTitle}>{fundraiser.title}</Text>
                <Text style={styles.fundraiserDescription} numberOfLines={2}>
                  {fundraiser.description}
                </Text>

                <View style={styles.fundraiserStats}>
                  <View style={styles.statItem}>
                    <DollarSign color="#10b981" size={16} />
                    <Text style={styles.statValue}>
                      {currencySymbol}{fundraiser.currentAmount.toLocaleString()}
                    </Text>
                    {fundraiser.type === 'goal' && fundraiser.targetAmount && (
                      <Text style={styles.statTarget}>
                        / {currencySymbol}{fundraiser.targetAmount.toLocaleString()}
                      </Text>
                    )}
                  </View>

                  <View style={styles.statItem}>
                    <Users color="#667eea" size={16} />
                    <Text style={styles.statValue}>{fundraiser.contributorsCount}</Text>
                    <Text style={styles.statLabel}>contributors</Text>
                  </View>

                  <View style={styles.statItem}>
                    <Calendar color="#f59e0b" size={16} />
                    <Text style={styles.statValue}>{getDaysRemaining(fundraiser.deadline)}</Text>
                    <Text style={styles.statLabel}>days left</Text>
                  </View>
                </View>

                {fundraiser.type === 'goal' && fundraiser.targetAmount && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[styles.progressFill, { width: `${getProgressPercentage(fundraiser)}%` }]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {getProgressPercentage(fundraiser).toFixed(1)}% completed
                    </Text>
                  </View>
                )}

                <View style={styles.fundraiserFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fundraiser.status) }]}>
                    <Text style={styles.statusText}>{fundraiser.status.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.createdDate}>
                    Created {new Date(fundraiser.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  upgradePrompt: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 24,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  upgradeButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#667eea',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  filterTabTextActive: {
    color: '#667eea',
  },
  fundraisersList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  fundraiserCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  fundraiserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fundraiserType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fundraiserTypeText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  fundraiserActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  fundraiserTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  fundraiserDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  fundraiserStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  statTarget: {
    fontSize: 12,
    color: '#666',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  fundraiserFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  createdDate: {
    fontSize: 12,
    color: '#666',
  },
});