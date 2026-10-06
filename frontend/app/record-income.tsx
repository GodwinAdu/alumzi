import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useIncomeTypes, useCreateIncome } from '@/hooks/useIncomes';
import { useMembers } from '@/hooks/useMembers';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { useFinancialPermissions } from '@/hooks/useFinancialPermissions';

type IncomeType = {
  _id: string;
  name: string;
  description?: string;
};

export default function RecordIncomePage() {
  const router = useRouter();
  const { associationId, groupId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.find(assoc => assoc.id === associationId) || userAssociations?.[0];
  const { user } = useAuth();
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [sourceMember, setSourceMember] = useState('');
  const [sourceType, setSourceType] = useState<'custom' | 'member'>('member');
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [type, setType] = useState<'dues' | 'donation' | 'event' | 'other'>('other');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'mobile' | 'other'>('cash');
  
  const { limits } = useSubscription();
  const { data: incomeTypesData, isLoading } = useIncomeTypes(selectedAssociation?.id || '');
  const createIncomeMutation = useCreateIncome();
  const { userRole, canCreateForAnyMember, canManageIncomeTypes, members: allowedMembers } = useFinancialPermissions();
  
  let incomeTypes = incomeTypesData?.incomeTypes || [];
  
  // Add default types for free users if no custom types exist
  if (!limits.hasCustomTypes && incomeTypes.length === 0) {
    incomeTypes = [
      { _id: 'default-1', name: 'Member Contributions', description: 'Regular member dues and contributions' },
      { _id: 'default-2', name: 'Other Income', description: 'Miscellaneous income sources' }
    ];
  }
  const members = allowedMembers;
  const currencySymbol = getCurrencySymbol(selectedAssociation?.currency || 'USD');

  useEffect(() => {
    if (incomeTypes.length > 0 && !selectedTypeId) {
      setSelectedTypeId(incomeTypes[0]._id);
    }
  }, [incomeTypes, selectedTypeId]);

  const handleSubmit = async () => {
    if (!amount || !description || !selectedTypeId || !user || !selectedAssociation) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // For default types, use a generic category name
    const finalTypeId = selectedTypeId.startsWith('default-') ? 'general' : selectedTypeId;

    createIncomeMutation.mutate({
      associationId: selectedAssociation.id,
      groupId: groupId as string | undefined,
      incomeTypeId: finalTypeId,
      amount: parseFloat(amount),
      description,
      source: sourceType === 'custom' ? source || undefined : undefined,
      sourceMember: sourceType === 'member' ? sourceMember || undefined : undefined,
      paymentMethod,
      type
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Income recorded successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      },
      onError: () => {
        Alert.alert('Error', 'Failed to record income');
      },
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Record Income' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Income Category *</Text>
              {canManageIncomeTypes && (
                <TouchableOpacity 
                  onPress={() => router.push(`/income-types?associationId=${selectedAssociation?.id}`)}
                >
                  <Text style={styles.manageLink}>Manage Types</Text>
                </TouchableOpacity>
              )}
            </View>
            {incomeTypes.length === 0 ? (
              <View style={styles.noTypesContainer}>
                <Text style={styles.noTypesText}>No income types available</Text>
                {canManageIncomeTypes && (
                  <TouchableOpacity 
                    style={styles.createTypeButton}
                    onPress={() => router.push(`/income-types?associationId=${selectedAssociation?.id}`)}
                  >
                    <Text style={styles.createTypeButtonText}>Create Income Types</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={styles.dropdownText}>
                  {incomeTypes.find(t => t._id === selectedTypeId)?.name || 'Select category'}
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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Income Type *</Text>
            <View style={styles.typeButtons}>
              {(['dues', 'donation', 'event', 'other'] as const).map(incomeType => (
                <TouchableOpacity
                  key={incomeType}
                  style={[styles.typeSelectButton, type === incomeType && styles.typeSelectButtonActive]}
                  onPress={() => setType(incomeType)}
                >
                  <Text style={[styles.typeSelectText, type === incomeType && styles.typeSelectTextActive]}>
                    {incomeType.charAt(0).toUpperCase() + incomeType.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Source</Text>
            <View style={styles.sourceTypeButtons}>
              {userRole !== 'member' && (
                <TouchableOpacity
                  style={[styles.sourceTypeButton, sourceType === 'custom' && styles.sourceTypeButtonActive]}
                  onPress={() => setSourceType('custom')}
                >
                  <Text style={[styles.sourceTypeText, sourceType === 'custom' && styles.sourceTypeTextActive]}>
                    Custom
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.sourceTypeButton, sourceType === 'member' && styles.sourceTypeButtonActive]}
                onPress={() => setSourceType('member')}
              >
                <Text style={[styles.sourceTypeText, sourceType === 'member' && styles.sourceTypeTextActive]}>
                  Member
                </Text>
              </TouchableOpacity>
            </View>
            
            {sourceType === 'custom' && userRole !== 'member' ? (
              <TextInput
                style={styles.input}
                placeholder="Enter source name (optional)"
                value={source}
                onChangeText={setSource}
              />
            ) : (
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowMemberPicker(true)}
              >
                <Text style={styles.dropdownText}>
                  {members.find(m => (m.id || m._id) === sourceMember)?.name || 'Select member'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            )}
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
            style={[styles.button, (!amount || !description || !selectedTypeId || createIncomeMutation.isPending) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!amount || !description || !selectedTypeId || createIncomeMutation.isPending}
          >
            <Text style={styles.buttonText}>
              {createIncomeMutation.isPending ? 'Recording...' : 'Record Income'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showCategoryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Income Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {incomeTypes.map(type => (
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

      <Modal visible={showMemberPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Member</Text>
              <TouchableOpacity onPress={() => {
                setShowMemberPicker(false);
                setMemberSearchQuery('');
              }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search members..."
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
              />
            </View>
            <ScrollView style={styles.modalList}>
              {members
                .filter(member => 
                  member.name?.toLowerCase().includes(memberSearchQuery.toLowerCase())
                )
                .map((member, index) => {
                  const memberId = member.id || member._id || index;
                  return (
                    <TouchableOpacity
                      key={memberId}
                      style={[styles.modalItem, sourceMember === memberId && styles.modalItemActive]}
                      onPress={() => {
                        setSourceMember(memberId);
                        setShowMemberPicker(false);
                        setMemberSearchQuery('');
                      }}
                    >
                      <Text style={[styles.modalItemText, sourceMember === memberId && styles.modalItemTextActive]}>
                        {member.name}
                      </Text>
                      <Text style={[styles.modalItemDesc, sourceMember === memberId && styles.modalItemDescActive]}>
                        {member.role}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
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
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeSelectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeSelectButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  typeSelectText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600' as const,
  },
  typeSelectTextActive: {
    color: '#fff',
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
  sourceTypeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sourceTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sourceTypeButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  sourceTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600' as const,
  },
  sourceTypeTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#10b981',
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
    backgroundColor: '#10b981',
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
    color: '#a7f3d0',
  },
  searchContainer: {
    padding: 20,
    paddingTop: 0,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  sourceTypeButtonDisabled: {
    opacity: 0.5,
  },
  sourceTypeTextDisabled: {
    color: '#ccc',
  },
  contributionInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  contributionText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600' as const,
  },
});
