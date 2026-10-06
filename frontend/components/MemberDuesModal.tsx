import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { X, DollarSign } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface MemberDuesModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  memberId: string;
  memberName: string;
}

export default function MemberDuesModal({ visible, onClose, groupId, memberId, memberName }: MemberDuesModalProps) {
  const queryClient = useQueryClient();
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['memberDues', groupId, memberId],
    queryFn: () => api.getMemberDuesForAdmin(groupId, memberId),
    enabled: visible && !!groupId && !!memberId,
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ paymentIds, paidAmount, notes }: { paymentIds: string[], paidAmount: number, notes?: string }) =>
      api.markMemberDuesPaid(paymentIds, paidAmount, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberDues', groupId, memberId] });
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
      setPaidAmount('');
      setNotes('');
      onClose();
      Alert.alert('Success', `Payment recorded for ${memberName}`);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to record payment');
    },
  });

  const handlePayAll = () => {
    const amount = parseFloat(paidAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const pendingPayments = data?.payments?.filter((p: any) => p.status === 'pending' || p.status === 'overdue') || [];
    if (pendingPayments.length === 0) {
      Alert.alert('Error', 'No pending payments found');
      return;
    }

    markPaidMutation.mutate({
      paymentIds: pendingPayments.map((p: any) => p._id),
      paidAmount: amount,
      notes: notes.trim() || undefined
    });
  };

  const pendingPayments = data?.payments?.filter((p: any) => p.status === 'pending' || p.status === 'overdue') || [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Pay Dues - {memberName}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#666" size={24} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#667eea" />
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.summary}>
                <Text style={styles.summaryText}>
                  Outstanding: ${data?.totalOutstanding || 0}
                </Text>
                <Text style={styles.summaryText}>
                  Pending Payments: {pendingPayments.length}
                </Text>
              </View>

              {pendingPayments.length > 0 ? (
                <>
                  <View style={styles.payments}>
                    {pendingPayments.map((payment: any) => (
                      <View key={payment._id} style={styles.paymentItem}>
                        <Text style={styles.paymentPeriod}>{payment.period}</Text>
                        <Text style={styles.paymentAmount}>${payment.amount}</Text>
                      </View>
                    ))}
                  </View>

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
                    placeholder="e.g., Cash payment, Bank transfer"
                    multiline
                    numberOfLines={2}
                  />

                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={handlePayAll}
                    disabled={markPaidMutation.isPending}
                  >
                    {markPaidMutation.isPending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <DollarSign color="#fff" size={16} />
                        <Text style={styles.payButtonText}>Record Payment</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.noDues}>
                  <Text style={styles.noDuesText}>No pending dues</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  loading: {
    padding: 32,
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  summary: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  payments: {
    marginBottom: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentPeriod: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#667eea',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  noDues: {
    padding: 32,
    alignItems: 'center',
  },
  noDuesText: {
    fontSize: 16,
    color: '#666',
  },
});