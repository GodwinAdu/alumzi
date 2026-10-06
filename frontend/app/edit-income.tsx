import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useAssociation } from '@/contexts/AssociationContext';
import { apiService } from '@/services/api';
import { useUpdateIncome } from '@/hooks/useIncomes';

type IncomeType = {
  _id: string;
  name: string;
  description?: string;
};

export default function EditIncomePage() {
  const router = useRouter();
  const { incomeId, associationId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.find(assoc => assoc.id === associationId) || userAssociations?.[0];
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [sourceMember, setSourceMember] = useState('');
  const [sourceType, setSourceType] = useState<'custom' | 'member'>('custom');
  const [members, setMembers] = useState<any[]>([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [type, setType] = useState<'dues' | 'donation' | 'event' | 'other'>('other');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'mobile' | 'other'>('cash');
  const [isLoading, setIsLoading] = useState(true);
  
  const updateIncomeMutation = useUpdateIncome();

  useEffect(() => {
    loadIncomeTypes();
    loadMembers();
  }, [selectedAssociation]);
  
  useEffect(() => {
    if (incomeTypes.length > 0) {
      loadIncomeData();
    }
  }, [incomeTypes, incomeId]);

  const loadIncomeData = async () => {
    if (!selectedAssociation || !incomeId) return;
    
    try {
      const response = await apiService.getIncomes(selectedAssociation.id);
      const income = response.incomes?.find((i: any) => i.id === incomeId);
      
      console.log('=== INCOME DATA FOR EDIT ===');
      console.log('Income ID:', incomeId);
      console.log('Found income:', income);
      console.log('All incomes:', response.incomes);
      
      if (income) {
        setAmount(income.amount.toString());
        setDescription(income.description);
        setSource(income.source || '');
        setSourceMember(income.sourceMember?.id || '');
        setSourceType(income.sourceMember ? 'member' : 'custom');
        setType(income.type || 'other');
        setPaymentMethod(income.paymentMethod || 'cash');
        
        // Load income types first, then set the selected type
        if (incomeTypes.length > 0) {
          const matchingType = incomeTypes.find(t => t.name === income.category);
          if (matchingType) {
            setSelectedTypeId(matchingType._id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load income data:', error);
    }
  };

  const loadIncomeTypes = async () => {
    if (!selectedAssociation) return;
    
    try {
      const response = await apiService.getIncomeTypes(selectedAssociation.id);
      setIncomeTypes(response.incomeTypes || []);
    } catch (error) {
      console.error('Failed to load income types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!selectedAssociation) return;
    
    try {
      const response = await apiService.getMembers(selectedAssociation.id);
      setMembers(response.members || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description || !selectedTypeId || !selectedAssociation) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const updateData = {
      incomeTypeId: selectedTypeId,
      amount: parseFloat(amount),
      description,
      source: sourceType === 'custom' ? source || undefined : undefined,
      sourceMember: sourceType === 'member' ? sourceMember || undefined : undefined,
      paymentMethod,
      type
    };
    
    updateIncomeMutation.mutate(
      { incomeId: incomeId as string, data: updateData },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Income updated successfully', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        },
        onError: () => {
          Alert.alert('Error', 'Failed to update income');
        },
      }
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Edit Income' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Income Category *</Text>
            </View>
            {incomeTypes.length === 0 ? (
              <View style={styles.noTypesContainer}>
                <Text style={styles.noTypesText}>No income types available</Text>
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
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
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
              <TouchableOpacity
                style={[styles.sourceTypeButton, sourceType === 'custom' && styles.sourceTypeButtonActive]}
                onPress={() => setSourceType('custom')}
              >
                <Text style={[styles.sourceTypeText, sourceType === 'custom' && styles.sourceTypeTextActive]}>
                  Custom
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sourceTypeButton, sourceType === 'member' && styles.sourceTypeButtonActive]}
                onPress={() => setSourceType('member')}
              >
                <Text style={[styles.sourceTypeText, sourceType === 'member' && styles.sourceTypeTextActive]}>
                  Member
                </Text>
              </TouchableOpacity>
            </View>
            
            {sourceType === 'custom' ? (
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
            style={[styles.button, (!amount || !description || !selectedTypeId || updateIncomeMutation.isPending) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!amount || !description || !selectedTypeId || updateIncomeMutation.isPending}
          >
            <Text style={styles.buttonText}>
              {updateIncomeMutation.isPending ? 'Updating...' : 'Update Income'}
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
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
});