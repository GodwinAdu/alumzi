import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useExpenseTypes, useCreateExpense } from '@/hooks/useExpenses';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { useFinancialSettings } from '@/hooks/useFinancialSettings';

type ExpenseType = {
  id: string;
  name: string;
  description?: string;
};

export default function RecordExpensePage() {
  const router = useRouter();
  const { associationId, groupId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.find(assoc => assoc.id === associationId) || userAssociations?.[0];
  const { user } = useAuth();
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'mobile' | 'other'>('cash');
  
  const { limits } = useSubscription();
  const { data: expenseTypesData, isLoading } = useExpenseTypes(selectedAssociation?.id || '');
  const createExpenseMutation = useCreateExpense();
  const { checkExpenseAutoApproval, isReceiptRequired } = useFinancialSettings();
  
  let expenseTypes = expenseTypesData?.expenseTypes || [];
  
  // Add default types for free users if no custom types exist
  if (!limits.hasCustomTypes && expenseTypes.length === 0) {
    expenseTypes = [
      { _id: 'default-1', name: 'Operating Expenses', description: 'General operational costs and utilities' },
      { _id: 'default-2', name: 'Other Expenses', description: 'Miscellaneous expenses and costs' }
    ];
  }
  const currencySymbol = getCurrencySymbol(selectedAssociation?.currency || 'USD');

  useEffect(() => {
    if (expenseTypes.length > 0 && !selectedTypeId) {
      setSelectedTypeId(expenseTypes[0]._id);
    }
  }, [expenseTypes, selectedTypeId]);

  const handleSubmit = async () => {
    if (!amount || !description || !selectedTypeId || !user || !selectedAssociation) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const expenseAmount = parseFloat(amount);
    const willAutoApprove = checkExpenseAutoApproval(expenseAmount);
    
    // For default types, use a generic category name
    const finalTypeId = selectedTypeId.startsWith('default-') ? 'general' : selectedTypeId;
    
    createExpenseMutation.mutate({
      associationId: selectedAssociation.id,
      groupId: groupId as string | undefined,
      expenseTypeId: finalTypeId,
      amount: expenseAmount,
      description,
      vendor: vendor || undefined,
      paymentMethod
    }, {
      onSuccess: () => {
        const message = willAutoApprove 
          ? 'Expense recorded and automatically approved'
          : 'Expense recorded successfully and is pending approval';
        Alert.alert('Success', message, [
          { text: 'OK', onPress: () => router.back() }
        ]);
      },
      onError: () => {
        Alert.alert('Error', 'Failed to record expense');
      },
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Record Expense' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Expense Category</Text>
              <TouchableOpacity 
                onPress={() => router.push(`/expense-types?associationId=${selectedAssociation?.id}`)}
              >
                <Text style={styles.manageLink}>Manage Types</Text>
              </TouchableOpacity>
            </View>
            {expenseTypes.length === 0 ? (
              <View style={styles.noTypesContainer}>
                <Text style={styles.noTypesText}>No expense types available</Text>
                <TouchableOpacity 
                  style={styles.createTypeButton}
                  onPress={() => router.push(`/expense-types?associationId=${selectedAssociation?.id}`)}
                >
                  <Text style={styles.createTypeButtonText}>Create Expense Types</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={styles.dropdownText}>
                  {expenseTypes.find(t => t._id === selectedTypeId)?.name || 'Select category'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>{currencySymbol}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
            {amount && parseFloat(amount) > 0 && (
              <View style={styles.approvalInfo}>
                <Text style={[styles.approvalText, {
                  color: checkExpenseAutoApproval(parseFloat(amount)) ? '#10b981' : '#f59e0b'
                }]}>
                  {checkExpenseAutoApproval(parseFloat(amount)) 
                    ? '✓ Will be automatically approved' 
                    : '⏳ Will require manual approval'
                  }
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter description..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
            {isReceiptRequired() && (
              <View style={styles.receiptInfo}>
                <Text style={styles.receiptText}>
                  📎 Receipt upload is required for all expenses
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vendor/Supplier</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              value={vendor}
              onChangeText={setVendor}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentButtons}>
              {(['cash', 'bank', 'mobile', 'other'] as const).map(method => (
                <TouchableOpacity
                  key={method}
                  style={[styles.paymentButton, paymentMethod === method && styles.paymentButtonActive]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextActive]}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, (!amount || !description || !selectedTypeId || createExpenseMutation.isPending) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!amount || !description || !selectedTypeId || createExpenseMutation.isPending}
          >
            <Text style={styles.buttonText}>
              {createExpenseMutation.isPending ? 'Recording...' : 'Record Expense'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showCategoryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Expense Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {expenseTypes.map((type: any) => (
                <TouchableOpacity
                  key={type._id}
                  style={[styles.modalItem, selectedTypeId === type._id && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedTypeId(type._id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedTypeId === type._id && styles.modalItemTextActive]}>
                    {type.name}
                  </Text>
                  {type.description && (
                    <Text style={[styles.modalItemDesc, selectedTypeId === type._id && styles.modalItemDescActive]}>
                      {type.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manageLink: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  noTypesContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noTypesText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  createTypeButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createTypeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  paymentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paymentButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  paymentText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600' as const,
  },
  paymentTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
  },
  modalList: {
    padding: 20,
  },
  modalItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  modalItemActive: {
    backgroundColor: '#ef4444',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  modalItemTextActive: {
    color: '#fff',
  },
  modalItemDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalItemDescActive: {
    color: '#fca5a5',
  },
  approvalInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  approvalText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  receiptInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  receiptText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600' as const,
  },
});
