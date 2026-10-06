import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAssociation } from '@/contexts/AssociationContext';
import { getCurrencySymbol } from '@/lib/utils/currency';

export default function ConsolidatedFinances() {
  const router = useRouter();
  const { communityId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.find(a => a.id === communityId) || userAssociations?.[0];
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['consolidatedFinances', communityId],
    queryFn: () => api.getConsolidatedFinances(communityId as string),
    enabled: !!communityId,
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
          <Text style={styles.headerTitle}>Consolidated Finances</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </SafeAreaView>
    );
  }

  const groups = data?.groups || [];
  const total = data?.communityTotal || { totalIncome: 0, totalExpense: 0, balance: 0 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Consolidated Finances</Text>
          <Text style={styles.headerSubtitle}>All Groups Overview</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.totalSection}>
          <Text style={styles.sectionTitle}>Community Total</Text>
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <View style={styles.totalItem}>
                <TrendingUp color="#10b981" size={20} />
                <Text style={styles.totalLabel}>Income</Text>
                <Text style={styles.totalAmount}>{currencySymbol}{total.totalIncome?.toFixed(2)}</Text>
              </View>
              <View style={styles.totalItem}>
                <TrendingDown color="#ef4444" size={20} />
                <Text style={styles.totalLabel}>Expenses</Text>
                <Text style={styles.totalAmount}>{currencySymbol}{total.totalExpense?.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Net Balance</Text>
              <Text style={[styles.balanceAmount, { color: total.balance >= 0 ? '#10b981' : '#ef4444' }]}>
                {currencySymbol}{total.balance?.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.groupsSection}>
          <Text style={styles.sectionTitle}>Groups Breakdown</Text>
          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No groups found</Text>
            </View>
          ) : (
            groups.map((group: any) => (
              <TouchableOpacity
                key={group.groupId}
                style={styles.groupCard}
                onPress={() => router.push(`/group-financial-dashboard?groupId=${group.groupId}&groupName=${group.groupName}`)}
              >
                <View style={styles.groupHeader}>
                  <View>
                    <Text style={styles.groupName}>{group.groupName}</Text>
                    <Text style={styles.groupType}>{group.groupType}</Text>
                  </View>
                  <ChevronRight color="#999" size={20} />
                </View>
                
                <View style={styles.groupStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Income</Text>
                    <Text style={[styles.statValue, styles.incomeText]}>
                      {currencySymbol}{group.totalIncome?.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Expenses</Text>
                    <Text style={[styles.statValue, styles.expenseText]}>
                      {currencySymbol}{group.totalExpense?.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Balance</Text>
                    <Text style={[styles.statValue, { color: group.balance >= 0 ? '#10b981' : '#ef4444' }]}>
                      {currencySymbol}{group.balance?.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
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
  totalSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  totalRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  totalItem: {
    flex: 1,
    gap: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600' as const,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  groupsSection: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  groupType: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  groupStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  incomeText: {
    color: '#10b981',
  },
  expenseText: {
    color: '#ef4444',
  },
});
