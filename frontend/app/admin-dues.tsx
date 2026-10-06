import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, DollarSign, Check, Plus } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AdminDuesScreen() {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['groupDuesStatus', groupId],
    queryFn: () => api.getGroupDuesStatus(groupId as string),
    enabled: !!groupId,
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ paymentIds, paidAmount, notes }: { paymentIds: string[], paidAmount: number, notes?: string }) =>
      api.markMemberDuesPaid(paymentIds, paidAmount, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupDuesStatus', groupId] });
      setShowPaymentModal(false);
      setSelectedPayments([]);
      setPaidAmount('');
      setNotes('');
      Alert.alert('Success', 'Payments marked as paid successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to mark payments as paid');
    },
  });

  const generateDuesMutation = useMutation({
    mutationFn: (period: string) => api.generateDues(groupId as string, period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupDuesStatus', groupId] });
      Alert.alert('Success', 'Dues generated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to generate dues');
    },
  });

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const handleMarkAsPaid = () => {
    if (selectedPayments.length === 0) {
      Alert.alert('Error', 'Please select at least one payment');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleGenerateDues = () => {
    const currentDate = new Date();
    const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    Alert.alert(
      'Generate Dues',
      `Generate dues for ${period}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate', onPress: () => generateDuesMutation.mutate(period) }
      ]
    );
  };

  const handleConfirmPayment = () => {
    const amount = parseFloat(paidAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    markPaidMutation.mutate({
      paymentIds: selectedPayments,
      paidAmount: amount,
      notes: notes.trim() || undefined
    });
  };

  const getSelectedTotal = () => {
    if (!data?.payments) return 0;
    return data.payments
      .filter((p: any) => selectedPayments.includes(p._id))
      .reduce((sum: number, p: any) => sum + p.amount, 0);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Dues</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </SafeAreaView>
    );
  }

  const pendingPayments = data?.payments?.filter((p: any) => p.status === 'pending' || p.status === 'overdue') || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{groupName}</Text>
          <Text style={styles.headerSubtitle}>Manage Dues</Text>
        </View>
        <TouchableOpacity onPress={handleGenerateDues} disabled={generateDuesMutation.isPending}>
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Dues Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Outstanding:</Text>
            <Text style={styles.summaryValue}>${data?.summary?.totalOutstanding || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending Payments:</Text>
            <Text style={styles.summaryValue}>{pendingPayments.length}</Text>
          </View>
        </View>

        {selectedPayments.length > 0 && (
          <View style={styles.actionBar}>
            <Text style={styles.actionText}>
              {selectedPayments.length} selected (${getSelectedTotal()})
            </Text>
            <TouchableOpacity style={styles.markPaidButton} onPress={handleMarkAsPaid}>
              <DollarSign color="#fff" size={16} />
              <Text style={styles.markPaidText}>Mark as Paid</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Payments</Text>
          {pendingPayments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pending payments</Text>
            </View>
          ) : (
            pendingPayments.map((payment: any) => (
              <TouchableOpacity
                key={payment._id}
                style={[
                  styles.paymentItem,
                  selectedPayments.includes(payment._id) && styles.paymentItemSelected
                ]}
                onPress={() => handleSelectPayment(payment._id)}
              >
                <View style={styles.paymentInfo}>
                  <Text style={styles.memberName}>
                    {payment.memberId?.firstName} {payment.memberId?.lastName}
                  </Text>
                  <Text style={styles.paymentDetails}>
                    {payment.period} • ${payment.amount}
                  </Text>
                  <Text style={styles.dueDate}>
                    Due: {new Date(payment.dueDate).toLocaleDateString()}
                  </Text>
                </View>
                {selectedPayments.includes(payment._id) && (
                  <View style={styles.checkmark}>
                    <Check color="#667eea" size={20} />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mark Payments as Paid</Text>
            
            <Text style={styles.modalLabel}>Selected Payments: {selectedPayments.length}</Text>
            <Text style={styles.modalLabel}>Total Due: ${getSelectedTotal()}</Text>
            
            <Text style={styles.inputLabel}>Amount Paid *</Text>
            <TextInput
              style={styles.input}
              value={paidAmount}
              onChangeText={setPaidAmount}
              keyboardType="numeric"
              placeholder="Enter amount paid"
            />
            
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., Cash payment, Bank transfer, etc."
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmPayment}
                disabled={markPaidMutation.isPending}
              >
                {markPaidMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmText}>Confirm Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  summary: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
  markPaidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  markPaidText: {
    color: '#fff',
    fontWeight: '600' as const,
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
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentItemSelected: {
    backgroundColor: '#f0f4ff',
  },
  paymentInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  paymentDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 12,
    color: '#999',
  },
  checkmark: {
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});