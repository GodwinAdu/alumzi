import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, Plus } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAssociation } from '@/contexts/AssociationContext';
import { getCurrencySymbol } from '@/lib/utils/currency';

export default function GroupFinancialDashboard() {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.[0];
  const [refreshing, setRefreshing] = useState(false);

  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ['groupFinancialSummary', groupId],
    queryFn: () => api.getGroupFinancialSummary(groupId as string),
    enabled: !!groupId,
  });

  const { data: groupData } = useQuery({
    queryKey: ['groupInfo', groupId],
    queryFn: async () => {
      const groups = await api.getCommunityGroups(selectedAssociation?.id || '');
      return groups.groups.find((g: any) => g.id === groupId);
    },
    enabled: !!groupId && !!selectedAssociation,
  });

  const displayName = (typeof groupName === 'string' && groupName.trim()) ? groupName : (groupData?.name || 'Group');

  const { data: incomesData } = useQuery({
    queryKey: ['groupIncomes', groupId],
    queryFn: () => api.getIncomes(selectedAssociation?.id || '', groupId as string),
    enabled: !!groupId && !!selectedAssociation,
  });

  const { data: expensesData } = useQuery({
    queryKey: ['groupExpenses', groupId],
    queryFn: () => api.getExpenses(selectedAssociation?.id || '', groupId as string),
    enabled: !!groupId && !!selectedAssociation,
  });

  const currencySymbol = getCurrencySymbol(selectedAssociation?.currency || 'USD');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Finances</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </SafeAreaView>
    );
  }

  const incomes = incomesData?.incomes || [];
  const expenses = expensesData?.expenses || [];
  const allTransactions = [...incomes.map((i: any) => ({ ...i, type: 'income' })), ...expenses.map((e: any) => ({ ...e, type: 'expense' }))]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{displayName}</Text>
          <Text style={styles.headerSubtitle}>Financial Dashboard</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.summaryCards}>
          <View style={[styles.card, styles.incomeCard]}>
            <TrendingUp color="#10b981" size={24} />
            <Text style={styles.cardLabel}>Total Income</Text>
            <Text style={styles.cardAmount}>{currencySymbol}{summary?.totalIncome?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.cardCount}>{summary?.incomeCount || 0} transactions</Text>
          </View>

          <View style={[styles.card, styles.expenseCard]}>
            <TrendingDown color="#ef4444" size={24} />
            <Text style={styles.cardLabel}>Total Expenses</Text>
            <Text style={styles.cardAmount}>{currencySymbol}{summary?.totalExpense?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.cardCount}>{summary?.expenseCount || 0} transactions</Text>
          </View>

          <View style={[styles.card, styles.balanceCard]}>
            <Text style={styles.cardLabel}>Net Balance</Text>
            <Text style={[styles.cardAmount, { color: (summary?.balance || 0) >= 0 ? '#10b981' : '#ef4444' }]}>
              {currencySymbol}{summary?.balance?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.incomeButton]}
            onPress={() => router.push(`/record-income?associationId=${selectedAssociation?.id}&groupId=${groupId}`)}
          >
            <Plus color="#fff" size={20} />
            <Text style={styles.actionButtonText}>Add Income</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.expenseButton]}
            onPress={() => router.push(`/record-expense?associationId=${selectedAssociation?.id}&groupId=${groupId}`)}
          >
            <Plus color="#fff" size={20} />
            <Text style={styles.actionButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {allTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            allTransactions.map((transaction: any, index: number) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, transaction.type === 'income' ? styles.incomeIcon : styles.expenseIcon]}>
                    {transaction.type === 'income' ? <TrendingUp color="#10b981" size={16} /> : <TrendingDown color="#ef4444" size={16} />}
                  </View>
                  <View>
                    <Text style={styles.transactionDesc}>{transaction.description}</Text>
                    <Text style={styles.transactionCategory}>{transaction.category}</Text>
                  </View>
                </View>
                <Text style={[styles.transactionAmount, transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
                  {transaction.type === 'income' ? '+' : '-'}{currencySymbol}{transaction.amount?.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  summaryCards: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    gap: 8,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600' as const,
  },
  cardAmount: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  cardCount: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  incomeButton: {
    backgroundColor: '#10b981',
  },
  expenseButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeIcon: {
    backgroundColor: '#d1fae5',
  },
  expenseIcon: {
    backgroundColor: '#fee2e2',
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  incomeAmount: {
    color: '#10b981',
  },
  expenseAmount: {
    color: '#ef4444',
  },
});
