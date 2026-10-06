import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard, Calendar, DollarSign } from 'lucide-react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function MemberDuesScreen() {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams();
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['memberDues', groupId],
    queryFn: () => api.getMemberDuesStatus(groupId as string),
    enabled: !!groupId,
  });

  const paymentMutation = useMutation({
    mutationFn: (paymentIds: string[]) => api.initializeDuesPayment(groupId as string, paymentIds),
    onSuccess: (response) => {
      Alert.alert(
        'Payment Initialized',
        'Redirecting to payment page...',
        [
          {
            text: 'Continue',
            onPress: () => {
              console.log('Payment URL:', response.authorization_url);
              refetch();
            }
          }
        ]
      );
    },
    onError: () => {
      Alert.alert('Error', 'Failed to initialize payment');
    },
  });

  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const handlePaySelected = () => {
    if (selectedPayments.length === 0) {
      Alert.alert('Error', 'Please select at least one payment');
      return;
    }
    paymentMutation.mutate(selectedPayments);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'overdue': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'overdue': return 'Overdue';
      default: return 'Pending';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dues Payment</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dues Payment</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No dues information available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingPayments = data.payments.filter(p => p.status !== 'paid');
  const selectedTotal = data.payments
    .filter(p => selectedPayments.includes(p._id))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{groupName}</Text>
          <Text style={styles.headerSubtitle}>Dues Payment</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <DollarSign color="#667eea" size={20} />
              <Text style={styles.summaryLabel}>Outstanding</Text>
              <Text style={styles.summaryValue}>{formatCurrency(data.totalOutstanding)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Calendar color="#f59e0b" size={20} />
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={styles.summaryValue}>{data.pendingDues}</Text>
            </View>
          </View>
          
          <View style={styles.duesInfo}>
            <Text style={styles.duesAmount}>{formatCurrency(data.group.duesAmount)}</Text>
            <Text style={styles.duesFrequency}>per {data.group.frequency}</Text>
            <Text style={styles.duesDescription}>{data.group.description}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {data.payments.map((payment) => (
            <TouchableOpacity
              key={payment._id}
              style={[
                styles.paymentItem,
                payment.status !== 'paid' && styles.paymentItemSelectable,
                selectedPayments.includes(payment._id) && styles.paymentItemSelected
              ]}
              onPress={() => payment.status !== 'paid' && togglePaymentSelection(payment._id)}
              disabled={payment.status === 'paid'}
            >
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentPeriod}>{payment.period}</Text>
                <Text style={styles.paymentDueDate}>Due: {formatDate(payment.dueDate)}</Text>
                {payment.paidDate && (
                  <Text style={styles.paymentPaidDate}>Paid: {formatDate(payment.paidDate)}</Text>
                )}
              </View>
              <View style={styles.paymentRight}>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(payment.status)}</Text>
                </View>
              </View>
              {payment.status !== 'paid' && selectedPayments.includes(payment._id) && (
                <View style={styles.selectedIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {pendingPayments.length > 0 && (
        <View style={styles.paymentFooter}>
          <View style={styles.paymentSummary}>
            <Text style={styles.selectedCount}>
              {selectedPayments.length} selected
            </Text>
            <Text style={styles.selectedTotal}>
              {formatCurrency(selectedTotal)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.payButton,
              selectedPayments.length === 0 && styles.payButtonDisabled
            ]}
            onPress={handlePaySelected}
            disabled={selectedPayments.length === 0 || paymentMutation.isPending}
          >
            {paymentMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <CreditCard color="#fff" size={20} />
                <Text style={styles.payButtonText}>Pay Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  duesInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  duesAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#667eea',
  },
  duesFrequency: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  duesDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  paymentItemSelectable: {
    backgroundColor: '#fff',
  },
  paymentItemSelected: {
    backgroundColor: '#f0f4ff',
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentPeriod: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  paymentDueDate: {
    fontSize: 12,
    color: '#666',
  },
  paymentPaidDate: {
    fontSize: 12,
    color: '#10b981',
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#fff',
    textTransform: 'uppercase',
  },
  selectedIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#667eea',
  },
  paymentFooter: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paymentSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
  },
  selectedTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#667eea',
  },
  payButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});