import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, TrendingUp, TrendingDown, Users, FileText, BarChart3, ArrowUpRight, ArrowDownLeft, Lock } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { apiService } from '@/services/api';
import { router } from 'expo-router';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { useSubscription } from '@/hooks/useSubscription';
import { CardSkeleton, ListItemSkeleton, StatCardSkeleton } from '@/components/SkeletonLoader';
import { useWebSocket } from '@/hooks/useWebSocket';

type ReportPeriod = 'week' | 'month' | 'year';
type ReportTab = 'overview' | 'members' | 'income' | 'expenses' | 'statement';

export default function ReportsPage() {
  const { selectedAssociation } = useAssociation();
  const privacy = usePrivacySettings();
  const { limits, plan } = useSubscription();
  const socket = useWebSocket();
  const currencySymbol = getCurrencySymbol(selectedAssociation?.currency || 'USD');
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedAssociation]);

  useEffect(() => {
    if (selectedAssociation?.id && socket) {
      socket.emit('join-association', selectedAssociation.id);
      return () => {
        socket.emit('leave-association', selectedAssociation.id);
      };
    }
  }, [selectedAssociation?.id, socket]);

  const loadData = async () => {
    if (!selectedAssociation) return;
    try {
      setLoading(true);
      const expensesRes = await apiService.getExpenses(selectedAssociation.id).catch(() => ({ expenses: [] })) as any;
      const incomesRes = await apiService.getIncomes(selectedAssociation.id).catch(() => ({ incomes: [] })) as any;
      const membersRes = await apiService.getMembers(selectedAssociation.id).catch(() => ({ members: [] })) as any;
      
      setExpenses(expensesRes.expenses || []);
      setIncomes(incomesRes.incomes || []);
      setMembers(membersRes.members || []);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (!selectedAssociation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No association selected</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!privacy.canViewFinancials) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <DollarSign color="#f59e0b" size={48} />
          <Text style={styles.errorTitle}>Financial Access Restricted</Text>
          <Text style={styles.errorText}>You don't have permission to view financial reports</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const renderOverview = () => {
    if (loading) {
      return (
        <View style={styles.tabContent}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      );
    }
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
            onPress={() => setPeriod('week')}
          >
            <Text style={[styles.periodText, period === 'week' && styles.periodTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'year' && styles.periodButtonActive]}
            onPress={() => setPeriod('year')}
          >
            <Text style={[styles.periodText, period === 'year' && styles.periodTextActive]}>Year</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Financial Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: '#d1fae5' }]}>
                <TrendingUp color="#10b981" size={24} />
              </View>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                {currencySymbol}{totalIncome.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: '#fee2e2' }]}>
                <TrendingDown color="#ef4444" size={24} />
              </View>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                {currencySymbol}{totalExpenses.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: '#e0e7ff' }]}>
                <DollarSign color="#667eea" size={24} />
              </View>
              <Text style={styles.summaryLabel}>Net Balance</Text>
              <Text style={[styles.summaryValue, { color: balance >= 0 ? '#10b981' : '#ef4444' }]}>
                {currencySymbol}{balance.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderUpgradePrompt = (feature: string) => (
    <View style={styles.upgradeContainer}>
      <Lock color="#f59e0b" size={48} />
      <Text style={styles.upgradeTitle}>Upgrade Required</Text>
      <Text style={styles.upgradeText}>{feature} is available on Pro and Enterprise plans</Text>
      <TouchableOpacity 
        style={styles.upgradeButton}
        onPress={() => router.push('/subscription-settings')}
      >
        <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'members':
        if (!limits.hasAdvancedReports) {
          return renderUpgradePrompt('Member Reports');
        }
        if (loading) {
          return (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Member Reports</Text>
              <ListItemSkeleton />
              <ListItemSkeleton />
              <ListItemSkeleton />
            </View>
          );
        }
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Member Reports</Text>
            <Text style={styles.subtitle}>{members.length} active members</Text>
            {members.length === 0 ? (
              <Text style={styles.placeholder}>No members found</Text>
            ) : (
              members.map(member => (
                <TouchableOpacity 
                  key={member.id} 
                  style={styles.memberCard}
                  onPress={() => router.push(`/member-statement?memberId=${member.id}`)}
                >
                  <View style={styles.memberIcon}>
                    <Users color="#667eea" size={20} />
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}>{member.role}</Text>
                  </View>
                  <ArrowUpRight color="#999" size={16} />
                </TouchableOpacity>
              ))
            )}
          </View>
        );
      case 'income':
        if (!limits.hasAdvancedReports) {
          return renderUpgradePrompt('Detailed Income Reports');
        }
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Income Report</Text>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Income</Text>
              <Text style={[styles.totalAmount, { color: '#10b981' }]}>
                {currencySymbol}{totalIncome.toLocaleString()}
              </Text>
              <Text style={styles.totalCount}>{incomes.length} transactions</Text>
            </View>
            {incomes.length === 0 ? (
              <Text style={styles.placeholder}>No income recorded</Text>
            ) : (
              incomes.map(income => (
                <View key={income.id} style={styles.transactionCard}>
                  <View style={styles.transactionIconWrapper}>
                    <ArrowUpRight color="#10b981" size={18} />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDesc}>{income.description}</Text>
                    <Text style={styles.transactionMeta}>
                      {income.category} • {new Date(income.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmt, { color: '#10b981' }]}>+{currencySymbol}{income.amount.toLocaleString()}</Text>
                </View>
              ))
            )}
          </View>
        );
      case 'expenses':
        if (!limits.hasAdvancedReports) {
          return renderUpgradePrompt('Detailed Expense Reports');
        }
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Expense Report</Text>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Expenses</Text>
              <Text style={[styles.totalAmount, { color: '#ef4444' }]}>
                {currencySymbol}{totalExpenses.toLocaleString()}
              </Text>
              <Text style={styles.totalCount}>{expenses.length} transactions</Text>
            </View>
            {expenses.length === 0 ? (
              <Text style={styles.placeholder}>No expenses recorded</Text>
            ) : (
              expenses.map(expense => (
                <View key={expense.id} style={styles.transactionCard}>
                  <View style={styles.transactionIconWrapper}>
                    <ArrowDownLeft color="#ef4444" size={18} />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDesc}>{expense.description}</Text>
                    <Text style={styles.transactionMeta}>
                      {expense.category} • {new Date(expense.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmt, { color: '#ef4444' }]}>-{currencySymbol}{expense.amount.toLocaleString()}</Text>
                </View>
              ))
            )}
          </View>
        );
      case 'statement':
        if (!limits.hasAdvancedReports) {
          return renderUpgradePrompt('Financial Statements');
        }
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Financial Statement</Text>
            <View style={styles.statementCard}>
              <View style={styles.statementRow}>
                <Text style={styles.statementLabel}>Total Income</Text>
                <Text style={[styles.statementValue, { color: '#10b981' }]}>+{currencySymbol}{totalIncome.toLocaleString()}</Text>
              </View>
              <View style={styles.statementRow}>
                <Text style={styles.statementLabel}>Total Expenses</Text>
                <Text style={[styles.statementValue, { color: '#ef4444' }]}>-{currencySymbol}{totalExpenses.toLocaleString()}</Text>
              </View>
              <View style={[styles.statementRow, styles.statementTotal]}>
                <Text style={styles.statementTotalLabel}>Net Balance</Text>
                <Text style={[styles.statementTotalValue, { color: balance >= 0 ? '#10b981' : '#ef4444' }]}>
                  {currencySymbol}{balance.toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.statementSummary}>
              <Text style={styles.summaryText}>• {incomes.length} income transactions</Text>
              <Text style={styles.summaryText}>• {expenses.length} expense transactions</Text>
              <Text style={styles.summaryText}>• {members.length} active members</Text>
            </View>
          </View>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <BarChart3 color={activeTab === 'overview' ? '#667eea' : '#666'} size={16} />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'members' && styles.activeTab, !limits.hasAdvancedReports && styles.lockedTab]}
            onPress={() => setActiveTab('members')}
          >
            <Users color={activeTab === 'members' ? '#667eea' : '#666'} size={16} />
            <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>Members</Text>
            {!limits.hasAdvancedReports && <Lock color="#f59e0b" size={12} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'income' && styles.activeTab, !limits.hasAdvancedReports && styles.lockedTab]}
            onPress={() => setActiveTab('income')}
          >
            <TrendingUp color={activeTab === 'income' ? '#667eea' : '#666'} size={16} />
            <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>Income</Text>
            {!limits.hasAdvancedReports && <Lock color="#f59e0b" size={12} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'expenses' && styles.activeTab, !limits.hasAdvancedReports && styles.lockedTab]}
            onPress={() => setActiveTab('expenses')}
          >
            <TrendingDown color={activeTab === 'expenses' ? '#667eea' : '#666'} size={16} />
            <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>Expenses</Text>
            {!limits.hasAdvancedReports && <Lock color="#f59e0b" size={12} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'statement' && styles.activeTab, !limits.hasAdvancedReports && styles.lockedTab]}
            onPress={() => setActiveTab('statement')}
          >
            <FileText color={activeTab === 'statement' ? '#667eea' : '#666'} size={16} />
            <Text style={[styles.tabText, activeTab === 'statement' && styles.activeTabText]}>Statement</Text>
            {!limits.hasAdvancedReports && <Lock color="#f59e0b" size={12} />}
          </TouchableOpacity>
        </ScrollView>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  activeTab: {
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  activeTabText: {
    color: '#667eea',
  },
  tabContent: {
    padding: 20,
    paddingBottom: 120,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#667eea',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  periodTextActive: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 20,
  },
  summaryGrid: {
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  totalCount: {
    fontSize: 14,
    color: '#999',
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionMeta: {
    fontSize: 13,
    color: '#999',
  },
  transactionAmt: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  statementCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statementLabel: {
    fontSize: 15,
    color: '#666',
  },
  statementValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statementTotal: {
    borderBottomWidth: 0,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  statementTotalLabel: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  statementTotalValue: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  statementSummary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  lockedTab: {
    opacity: 0.6,
  },
});
