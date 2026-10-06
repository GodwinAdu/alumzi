import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { FileText, Download, Share2, Calendar, DollarSign, TrendingUp, User } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { useMemberStatement } from '@/hooks/useMembers';
import { getCurrencySymbol } from '@/lib/utils/currency';

export default function MemberStatementPage() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams();
  const { userAssociations, selectedAssociation } = useAssociation();
  const association = selectedAssociation || userAssociations?.[0];
  const currencySymbol = getCurrencySymbol(association?.currency || 'USD');
  
  const [dateRange, setDateRange] = useState('all');
  
  const { data: statementData, isLoading: loading } = useMemberStatement(memberId as string);
  
  const member = statementData?.statement?.member;
  const statement = statementData?.statement ? {
    totalContributions: statementData.statement.summary.totalContributions,
    totalDues: statementData.statement.summary.totalExpenses,
    balance: statementData.statement.summary.balance,
    transactions: statementData.statement.transactions
  } : null;

  const handleShare = async () => {
    const statementText = `
Member Statement - ${association?.name}
Member: ${member?.name}
Period: ${dateRange === 'all' ? 'All Time' : dateRange}

Total Contributions: ${currencySymbol}${statement?.totalContributions?.toLocaleString()}
Total Dues: ${currencySymbol}${statement?.totalDues?.toLocaleString()}
Balance: ${currencySymbol}${statement?.balance?.toLocaleString()}

Generated on ${new Date().toLocaleDateString()}
    `;

    try {
      await Share.share({
        message: statementText,
        title: 'Member Statement'
      });
    } catch (error) {
      console.error('Error sharing statement:', error);
    }
  };

  const getTransactionIcon = (type: string) => {
    return type === 'income' ? 
      <TrendingUp color="#10b981" size={16} /> : 
      <DollarSign color="#f59e0b" size={16} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Member Statement' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading statement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Member Statement',
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
              <Share2 color="#667eea" size={20} />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView style={styles.content}>
        {/* Member Info */}
        <View style={styles.memberCard}>
          <View style={styles.memberHeader}>
            <View style={styles.memberAvatar}>
              <User color="#fff" size={24} />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member?.name}</Text>
              <Text style={styles.memberContact}>{member?.email || member?.phoneNumber}</Text>
              <Text style={styles.memberMeta}>
                {member?.role} • Joined {member?.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Date Range Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Period</Text>
          <View style={styles.filterButtons}>
            {['all', 'this-year', 'last-6-months', 'last-3-months'].map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.filterButton, dateRange === range && styles.filterButtonActive]}
                onPress={() => setDateRange(range)}
              >
                <Text style={[styles.filterButtonText, dateRange === range && styles.filterButtonTextActive]}>
                  {range === 'all' ? 'All Time' : 
                   range === 'this-year' ? 'This Year' :
                   range === 'last-6-months' ? 'Last 6 Months' : 'Last 3 Months'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <TrendingUp color="#10b981" size={24} />
            <Text style={styles.summaryAmount}>{currencySymbol}{statement?.totalContributions?.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Contributions</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <DollarSign color="#f59e0b" size={24} />
            <Text style={styles.summaryAmount}>{currencySymbol}{statement?.totalDues?.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Dues</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <FileText color="#667eea" size={24} />
            <Text style={styles.summaryAmount}>{currencySymbol}{statement?.balance?.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Net Balance</Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          
          {statement?.transactions?.map((transaction: any) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionIcon}>
                {getTransactionIcon(transaction.type)}
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.transactionRight}>
                <Text style={[styles.transactionAmount, {
                  color: transaction.type === 'income' ? '#10b981' : '#f59e0b'
                }]}>
                  {transaction.type === 'income' ? '+' : '-'}{currencySymbol}{transaction.amount.toLocaleString()}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(transaction.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                    {transaction.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Share2 color="#667eea" size={20} />
            <Text style={styles.actionButtonText}>Share Statement</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Download color="#667eea" size={20} />
            <Text style={styles.actionButtonText}>Download PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  memberContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memberMeta: {
    fontSize: 12,
    color: '#999',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#1a1a1a',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
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
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#667eea',
  },
});