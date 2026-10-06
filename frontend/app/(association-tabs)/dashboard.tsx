import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, TrendingUp, CreditCard, Users, Plus, ArrowUpRight, ArrowDownRight, ArrowLeft, Bell, Target, Heart, Calendar, BarChart3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { api } from '@/lib/api';
import { apiService } from '@/services/api';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/SkeletonLoader';
import { useWebSocket } from '@/hooks/useWebSocket';


interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
}

interface Fundraiser {
  id: string;
  type: 'goal' | 'contribution';
  title: string;
  description: string;
  targetAmount?: number;
  currentAmount: number;
  deadline: string;
  status: 'active' | 'completed' | 'expired';
  contributorsCount: number;
}

export default function DashboardPage() {
  const { selectedAssociation } = useAssociation();
  const { user } = useAuth();
  const { limits } = useSubscription();
  const privacy = usePrivacySettings();
  const { unreadCount } = useNotificationContext();
  const socket = useWebSocket();
  
  console.log('Dashboard - selectedAssociation:', selectedAssociation);
  
  const currencySymbol = getCurrencySymbol(selectedAssociation?.currency || 'USD');
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    members: 0,
    recentTransactions: [] as Transaction[]
  });
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundraisersLoading, setFundraisersLoading] = useState(true);

  useEffect(() => {
    if (selectedAssociation?.id) {
      fetchDashboardData();
      // Only fetch fundraisers if user has payment processing (premium feature)
      if (limits.hasPaymentProcessing) {
        fetchFundraisers();
      }
    }
  }, [selectedAssociation?.id, limits.hasPaymentProcessing]);

  // Join association room for real-time updates
  useEffect(() => {
    if (selectedAssociation?.id && socket) {
      socket.emit('join-association', selectedAssociation.id);
      console.log('📡 Dashboard joined association room:', selectedAssociation.id);
      
      return () => {
        socket.emit('leave-association', selectedAssociation.id);
        console.log('📡 Dashboard left association room:', selectedAssociation.id);
      };
    }
  }, [selectedAssociation?.id, socket]);

  useEffect(() => {
    console.log('Dashboard - selectedAssociation:', selectedAssociation);
  }, [selectedAssociation]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await api.getDashboardData(selectedAssociation?.id || '');
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFundraisers = async () => {
    try {
      setFundraisersLoading(true);
      const response = await apiService.getActiveFundraisers(selectedAssociation?.id || '') as { fundraisers: Fundraiser[] };
      setFundraisers(response.fundraisers || []);
    } catch (error) {
      console.error('Error fetching fundraisers:', error);
      // Set empty array on error to prevent UI issues
      setFundraisers([]);
    } finally {
      setFundraisersLoading(false);
    }
  };

  if (!selectedAssociation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <DollarSign color="#ccc" size={48} />
          <Text style={styles.emptyTitle}>No Association Selected</Text>
          <Text style={styles.emptyText}>Please select an association to view the dashboard</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!privacy.canViewFinancials) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <DollarSign color="#f59e0b" size={48} />
          <Text style={styles.emptyTitle}>Financial Access Restricted</Text>
          <Text style={styles.emptyText}>You don't have permission to view financial data</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.replace('/(auth-tabs)/home')}
                >
                  <ArrowLeft color="#667eea" size={20} />
                  <Text style={styles.backButtonText}>Back to Home</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.notificationButton}
                  onPress={() => router.push('/notifications')}
                >
                  <Bell color="#667eea" size={20} />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.title}>Financial Dashboard</Text>
              <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
            </View>

            <View style={styles.statsGrid}>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </View>

            {/* Active Fundraisers Section */}
            {fundraisers.length > 0 && (
              <View style={styles.fundraisersSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Active Campaigns</Text>
                  <TouchableOpacity onPress={() => router.push(`/create-fundraiser?associationId=${selectedAssociation?.id}`)}>
                    <Text style={styles.viewAllText}>Create New</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fundraisersList}>
                  {fundraisers.map(fundraiser => {
                    const progressPercentage = fundraiser.type === 'goal' && fundraiser.targetAmount 
                      ? Math.min((fundraiser.currentAmount / fundraiser.targetAmount) * 100, 100)
                      : 0;
                    const daysLeft = Math.max(0, Math.ceil((new Date(fundraiser.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                    
                    return (
                      <TouchableOpacity 
                        key={fundraiser.id}
                        style={styles.fundraiserCard}
                        onPress={() => router.push(`/fundraiser-details?fundraiserId=${fundraiser.id}&associationId=${selectedAssociation?.id}`)}
                      >
                        <View style={styles.fundraiserHeader}>
                          <View style={styles.fundraiserType}>
                            {fundraiser.type === 'goal' ? (
                              <Target color="#667eea" size={16} />
                            ) : (
                              <Users color="#667eea" size={16} />
                            )}
                            <Text style={styles.fundraiserTypeText}>
                              {fundraiser.type === 'goal' ? 'Goal' : 'Contribution'}
                            </Text>
                          </View>
                          <View style={styles.fundraiserDeadline}>
                            <Calendar color="#f59e0b" size={12} />
                            <Text style={styles.fundraiserDeadlineText}>{daysLeft}d left</Text>
                          </View>
                        </View>
                        
                        <Text style={styles.fundraiserTitle} numberOfLines={2}>{fundraiser.title}</Text>
                        
                        <View style={styles.fundraiserProgress}>
                          <Text style={styles.fundraiserAmount}>
                            {currencySymbol}{fundraiser.currentAmount.toLocaleString()}
                          </Text>
                          {fundraiser.type === 'goal' && fundraiser.targetAmount && (
                            <Text style={styles.fundraiserTarget}>
                              of {currencySymbol}{fundraiser.targetAmount.toLocaleString()}
                            </Text>
                          )}
                        </View>
                        
                        {fundraiser.type === 'goal' && (
                          <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                          </View>
                        )}
                        
                        <View style={styles.fundraiserFooter}>
                          <Text style={styles.contributorsCount}>
                            {fundraiser.contributorsCount} contributors
                          </Text>
                          <TouchableOpacity 
                            style={styles.contributeButton}
                            onPress={() => router.push(`/contribute?fundraiserId=${fundraiser.id}&associationId=${selectedAssociation?.id}`)}
                          >
                            <Heart color="#ef4444" size={14} />
                            <Text style={styles.contributeButtonText}>Contribute</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Member Dues Section */}
            {selectedAssociation?.settings?.dues?.enabled && (
              <View style={styles.duesSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Member Dues</Text>
                  <TouchableOpacity onPress={() => router.push(`/member-dues?associationId=${selectedAssociation?.id}`)}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.duesOverview}>
                  <View style={styles.duesCard}>
                    <Text style={styles.duesAmount}>
                      {currencySymbol}{(selectedAssociation.settings.dues.amount || 0).toLocaleString()}
                    </Text>
                    <Text style={styles.duesFrequency}>per {selectedAssociation.settings.dues.frequency || 'month'}</Text>
                  </View>
                  <View style={styles.duesStats}>
                    <View style={styles.duesStat}>
                      <Text style={styles.duesStatValue}>85%</Text>
                      <Text style={styles.duesStatLabel}>Paid</Text>
                    </View>
                    <View style={styles.duesStat}>
                      <Text style={[styles.duesStatValue, { color: '#ef4444' }]}>3</Text>
                      <Text style={styles.duesStatLabel}>Overdue</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => router.push('/(association-tabs)/income')}
                >
                  <Plus color="#10b981" size={20} />
                  <Text style={styles.quickActionText}>Add Income</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => router.push('/(association-tabs)/expenses')}
                >
                  <Plus color="#f59e0b" size={20} />
                  <Text style={styles.quickActionText}>Add Expense</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.recentTransactions}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <TouchableOpacity onPress={() => router.push('/(association-tabs)/report')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
            </View>
          </>
        ) : (
          <>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.replace('/(auth-tabs)/home')}
            >
              <ArrowLeft color="#667eea" size={20} />
              <Text style={styles.backButtonText}>Back to Home</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
            >
              <Bell color="#667eea" size={20} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Financial Dashboard</Text>
          <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <DollarSign color="#10b981" size={24} />
            </View>
            <Text style={styles.statValue}>{currencySymbol}{stats.totalIncome.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Income</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <CreditCard color="#f59e0b" size={24} />
            </View>
            <Text style={styles.statValue}>{currencySymbol}{stats.totalExpenses.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <TrendingUp color="#667eea" size={24} />
            </View>
            <Text style={styles.statValue}>{currencySymbol}{stats.balance.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Current Balance</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Users color="#8b5cf6" size={24} />
            </View>
            <Text style={styles.statValue}>{stats.members}</Text>
            <Text style={styles.statLabel}>Active Members</Text>
          </View>
        </View>

        {/* Active Fundraisers Section */}
        {fundraisers.length > 0 && (
          <View style={styles.fundraisersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Campaigns</Text>
              <TouchableOpacity onPress={() => router.push(`/create-fundraiser?associationId=${selectedAssociation?.id}`)}>
                <Text style={styles.viewAllText}>Create New</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fundraisersList}>
              {fundraisers.map(fundraiser => {
                const progressPercentage = fundraiser.type === 'goal' && fundraiser.targetAmount 
                  ? Math.min((fundraiser.currentAmount / fundraiser.targetAmount) * 100, 100)
                  : 0;
                const daysLeft = Math.max(0, Math.ceil((new Date(fundraiser.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                
                return (
                  <TouchableOpacity 
                    key={fundraiser.id}
                    style={styles.fundraiserCard}
                    onPress={() => router.push(`/fundraiser-details?fundraiserId=${fundraiser.id}&associationId=${selectedAssociation?.id}`)}
                  >
                    <View style={styles.fundraiserHeader}>
                      <View style={styles.fundraiserType}>
                        {fundraiser.type === 'goal' ? (
                          <Target color="#667eea" size={16} />
                        ) : (
                          <Users color="#667eea" size={16} />
                        )}
                        <Text style={styles.fundraiserTypeText}>
                          {fundraiser.type === 'goal' ? 'Goal' : 'Contribution'}
                        </Text>
                      </View>
                      <View style={styles.fundraiserDeadline}>
                        <Calendar color="#f59e0b" size={12} />
                        <Text style={styles.fundraiserDeadlineText}>{daysLeft}d left</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.fundraiserTitle} numberOfLines={2}>{fundraiser.title}</Text>
                    
                    <View style={styles.fundraiserProgress}>
                      <Text style={styles.fundraiserAmount}>
                        {currencySymbol}{fundraiser.currentAmount.toLocaleString()}
                      </Text>
                      {fundraiser.type === 'goal' && fundraiser.targetAmount && (
                        <Text style={styles.fundraiserTarget}>
                          of {currencySymbol}{fundraiser.targetAmount.toLocaleString()}
                        </Text>
                      )}
                    </View>
                    
                    {fundraiser.type === 'goal' && (
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                      </View>
                    )}
                    
                    <View style={styles.fundraiserFooter}>
                      <Text style={styles.contributorsCount}>
                        {fundraiser.contributorsCount} contributors
                      </Text>
                      <TouchableOpacity 
                        style={styles.contributeButton}
                        onPress={() => router.push(`/contribute?fundraiserId=${fundraiser.id}&associationId=${selectedAssociation?.id}`)}
                      >
                        <Heart color="#ef4444" size={14} />
                        <Text style={styles.contributeButtonText}>Contribute</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push(`/community-groups?communityId=${selectedAssociation?.id}`)}
            >
              <Users color="#667eea" size={20} />
              <Text style={styles.quickActionText}>View Groups</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(association-tabs)/income')}
            >
              <Plus color="#10b981" size={20} />
              <Text style={styles.quickActionText}>Add Income</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(association-tabs)/expenses')}
            >
              <Plus color="#f59e0b" size={20} />
              <Text style={styles.quickActionText}>Add Expense</Text>
            </TouchableOpacity>
            
            {(selectedAssociation?.role === 'admin' || selectedAssociation?.role === 'moderator') && (
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => router.push(`/consolidated-finances?communityId=${selectedAssociation?.id}`)}
              >
                <BarChart3 color="#8b5cf6" size={20} />
                <Text style={styles.quickActionText}>All Finances</Text>
              </TouchableOpacity>
            )}
            
            {!(selectedAssociation?.role === 'admin' || selectedAssociation?.role === 'moderator') && (
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => router.push('/(association-tabs)/members')}
              >
                <Users color="#8b5cf6" size={20} />
                <Text style={styles.quickActionText}>Members</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.recentTransactions}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/(association-tabs)/report')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {stats.recentTransactions.map(transaction => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionIcon}>
                {transaction.type === 'income' ? (
                  <ArrowUpRight color="#10b981" size={20} />
                ) : (
                  <ArrowDownRight color="#f59e0b" size={20} />
                )}
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.transactionAmount, {
                color: transaction.type === 'income' ? '#10b981' : '#f59e0b'
              }]}>
                {transaction.type === 'income' ? '+' : '-'}{currencySymbol}{transaction.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600' as const,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  recentTransactions: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  fundraisersSection: {
    marginBottom: 24,
  },
  fundraisersList: {
    marginTop: 8,
  },
  fundraiserCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 280,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  fundraiserDeadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fundraiserDeadlineText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600' as const,
  },
  fundraiserTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 22,
  },
  fundraiserProgress: {
    marginBottom: 8,
  },
  fundraiserAmount: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#10b981',
  },
  fundraiserTarget: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  fundraiserFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contributorsCount: {
    fontSize: 12,
    color: '#666',
  },
  contributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  contributeButtonText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600' as const,
  },
  duesSection: {
    marginBottom: 24,
  },
  duesOverview: {
    flexDirection: 'row',
    gap: 12,
  },
  duesCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  duesAmount: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#667eea',
    marginBottom: 4,
  },
  duesFrequency: {
    fontSize: 12,
    color: '#666',
  },
  duesStats: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  duesStat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  duesStatValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#10b981',
    marginBottom: 4,
  },
  duesStatLabel: {
    fontSize: 12,
    color: '#666',
  },
});