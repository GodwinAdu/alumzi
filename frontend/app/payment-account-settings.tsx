import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, ArrowLeft, Edit3, Plus } from 'lucide-react-native';
import { router, Stack } from 'expo-router';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { useSubscription } from '@/hooks/useSubscription';
import { api } from '@/lib/api';

interface PaymentAccount {
  id: string;
  accountType: 'bank' | 'momo';
  accountNumber: string;
  accountName: string;
  bankCode?: string;
  bankName?: string;
  momoProvider?: 'mtn' | 'vodafone' | 'airtel';
}

interface Settlement {
  id: string;
  month: string;
  year: number;
  totalCollected: number;
  platformFee: number;
  platformFeePercentage: number;
  netAmount: number;
  status: 'pending' | 'completed' | 'failed';
  settlementDate?: string;
  transactionCount: number;
}



export default function PaymentAccountSettingsPage() {
  const { selectedAssociation } = useAssociation();
  const { user } = useAuth();
  const { data: membersData } = useMembers(selectedAssociation?.id || '');
  const { subscription, limits } = useSubscription();
  
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSettlements, setLoadingSettlements] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    accountType: 'bank' as 'bank' | 'momo',
    accountNumber: '',
    accountName: '',
    bankCode: '',
    bankName: '',
    momoProvider: 'mtn' as 'mtn' | 'vodafone' | 'airtel'
  });


  const members = membersData?.members || [];
  const currentMember = members.find(m => m.userId === user?.id);
  const userRole = currentMember?.role || 'member';
  const canManagePayments = userRole === 'admin' || userRole === 'moderator';

  useEffect(() => {
    if (selectedAssociation?.id) {
      loadPaymentAccount();
      loadSettlements();
    }
  }, [selectedAssociation?.id]);

  const loadPaymentAccount = async () => {
    try {
      setLoading(true);
      const response = await api.getPaymentAccount(selectedAssociation?.id || '');
      setPaymentAccount(response.account);
    } catch (error) {
      console.error('Error loading payment account:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettlements = async () => {
    try {
      setLoadingSettlements(true);
      const response = await api.getSettlements(selectedAssociation?.id || '');
      setSettlements(response.settlements || []);
    } catch (error) {
      console.error('Error loading settlements:', error);
      setSettlements([]);
    } finally {
      setLoadingSettlements(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#666';
    }
  };





  const handleSave = async () => {
    if (!formData.accountNumber || !formData.accountName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.accountType === 'bank' && !formData.bankName) {
      Alert.alert('Error', 'Please enter bank name');
      return;
    }

    try {
      await api.createPaymentAccount(selectedAssociation?.id || '', formData);
      Alert.alert('Success', 'Payment account saved successfully');
      setShowAddModal(false);
      loadPaymentAccount();
      setFormData({
        accountType: 'bank',
        accountNumber: '',
        accountName: '',
        bankCode: '',
        bankName: '',
        momoProvider: 'mtn'
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save payment account');
    }
  };

  if (!selectedAssociation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <CreditCard color="#ccc" size={48} />
          <Text style={styles.emptyTitle}>No Association Selected</Text>
          <Text style={styles.emptyText}>Please select an association to manage payment accounts</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canManagePayments) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#667eea" size={20} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Settlement Account</Text>
            <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
          </View>
          <View style={styles.restrictedAccess}>
            <CreditCard color="#f59e0b" size={48} />
            <Text style={styles.restrictedTitle}>Access Restricted</Text>
            <Text style={styles.restrictedText}>
              Only admins and moderators can manage settlement accounts
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!limits.hasPaymentProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#667eea" size={20} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Settlement Account</Text>
            <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
          </View>
          <View style={styles.restrictedAccess}>
            <CreditCard color="#667eea" size={48} />
            <Text style={styles.restrictedTitle}>Upgrade Required</Text>
            <Text style={styles.restrictedText}>
              Payment processing is available on Pro and Enterprise plans
            </Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => router.push('/subscription-settings')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft color="#667eea" size={20} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>Settlement Account</Text>
            <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
          </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading payment account...</Text>
          </View>
        ) : paymentAccount ? (
          <View style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <View style={styles.accountIcon}>
                <CreditCard color="#10b981" size={24} />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{paymentAccount.accountName}</Text>
                <Text style={styles.accountNumber}>
                  {paymentAccount.accountType === 'bank' ? paymentAccount.bankName : paymentAccount.momoProvider?.toUpperCase()} • 
                  ****{paymentAccount.accountNumber.slice(-4)}
                </Text>
                <Text style={styles.accountType}>
                  {paymentAccount.accountType === 'bank' ? 'Bank Account' : 'Mobile Money'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  setFormData({
                    accountType: paymentAccount.accountType,
                    accountNumber: paymentAccount.accountNumber,
                    accountName: paymentAccount.accountName,
                    bankCode: paymentAccount.bankCode || '',
                    bankName: paymentAccount.bankName || '',
                    momoProvider: paymentAccount.momoProvider || 'mtn'
                  });
                  setShowAddModal(true);
                }}
              >
                <Edit3 color="#667eea" size={16} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyAccount}>
            <CreditCard color="#ccc" size={48} />
            <Text style={styles.emptyAccountTitle}>No Payment Account</Text>
            <Text style={styles.emptyAccountText}>
              Set up your bank account to receive monthly settlements from Alumzi
            </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus color="#fff" size={16} />
              <Text style={styles.addButtonText}>Add Payment Account</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Alumzi Payments Work</Text>
          <Text style={styles.infoText}>
            • Members pay into Alumzi's secure payment system{'\n'}
            • Alumzi collects and holds all association funds{'\n'}
            • Monthly settlements are transferred to your account{'\n'}
            • All transactions are processed through Alumzi's Paystack{'\n'}
            • You receive detailed monthly settlement reports
          </Text>
        </View>

        {paymentAccount && (
          <View style={styles.settlementCard}>
            <Text style={styles.settlementTitle}>Settlement Schedule</Text>
            <View style={styles.settlementInfo}>
              <View style={styles.settlementItem}>
                <Text style={styles.settlementLabel}>Frequency</Text>
                <Text style={styles.settlementValue}>Monthly (1st of each month)</Text>
              </View>
              <View style={styles.settlementItem}>
                <Text style={styles.settlementLabel}>Processing Time</Text>
                <Text style={styles.settlementValue}>1-3 business days</Text>
              </View>
              <View style={styles.settlementItem}>
                <Text style={styles.settlementLabel}>Platform Fee</Text>
                <Text style={styles.settlementValue}>2.5% + ₦100</Text>
              </View>
              <View style={styles.settlementItem}>
                <Text style={styles.settlementLabel}>Minimum Amount</Text>
                <Text style={styles.settlementValue}>₦1,000</Text>
              </View>
            </View>
          </View>
        )}

        {paymentAccount && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Settlement History</Text>
            {loadingSettlements ? (
              <Text style={styles.loadingText}>Loading settlements...</Text>
            ) : settlements.length > 0 ? (
              <View style={styles.historyList}>
                {settlements.map((settlement) => (
                  <View key={settlement.id} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyMonth}>
                        {settlement.month} {settlement.year}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(settlement.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(settlement.status) }]}>
                          {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyDetails}>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyLabel}>Total Collected</Text>
                        <Text style={styles.historyValue}>{formatCurrency(settlement.totalCollected)}</Text>
                      </View>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyLabel}>Platform Fee ({settlement.platformFeePercentage}%)</Text>
                        <Text style={styles.historyFee}>-{formatCurrency(settlement.platformFee)}</Text>
                      </View>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyLabel}>Net Settlement</Text>
                        <Text style={styles.historyNet}>{formatCurrency(settlement.netAmount)}</Text>
                      </View>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyLabel}>Transactions</Text>
                        <Text style={styles.historyValue}>{settlement.transactionCount}</Text>
                      </View>
                      {settlement.settlementDate && (
                        <View style={styles.historyRow}>
                          <Text style={styles.historyLabel}>Settlement Date</Text>
                          <Text style={styles.historyValue}>
                            {new Date(settlement.settlementDate).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryText}>No settlements yet</Text>
                <Text style={styles.emptyHistorySubtext}>
                  Settlements will appear here after your first monthly payout
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {paymentAccount ? 'Update' : 'Add'} Settlement Account
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeOption, formData.accountType === 'bank' && styles.typeOptionActive]}
                  onPress={() => setFormData(prev => ({ ...prev, accountType: 'bank' }))}
                >
                  <Text style={[styles.typeText, formData.accountType === 'bank' && styles.typeTextActive]}>
                    Bank Account
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeOption, formData.accountType === 'momo' && styles.typeOptionActive]}
                  onPress={() => setFormData(prev => ({ ...prev, accountType: 'momo' }))}
                >
                  <Text style={[styles.typeText, formData.accountType === 'momo' && styles.typeTextActive]}>
                    Mobile Money
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {formData.accountType === 'bank' ? (
              <>
                <View style={styles.section}>
                  <Text style={styles.label}>Bank Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.bankName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, bankName: text }))}
                    placeholder="Enter bank name"
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Account Number</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.accountNumber}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, accountNumber: text }))}
                    placeholder="Enter account number"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Account Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.accountName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, accountName: text }))}
                    placeholder="Enter account holder name"
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.section}>
                  <Text style={styles.label}>Mobile Money Provider</Text>
                  <View style={styles.providerSelector}>
                    {['mtn', 'vodafone', 'airtel'].map(provider => (
                      <TouchableOpacity
                        key={provider}
                        style={[styles.providerOption, formData.momoProvider === provider && styles.providerOptionActive]}
                        onPress={() => setFormData(prev => ({ ...prev, momoProvider: provider as any }))}
                      >
                        <Text style={[styles.providerText, formData.momoProvider === provider && styles.providerTextActive]}>
                          {provider.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.accountNumber}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, accountNumber: text }))}
                    placeholder="Enter mobile number"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Account Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.accountName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, accountName: text }))}
                    placeholder="Enter account holder name"
                  />
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </>
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
  contentContainer: {
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
  },
  headerTop: {
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600' as const,
  },
  editButton: {
    padding: 8,
  },
  emptyAccount: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyAccountTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyAccountText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  saveText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeOptionActive: {
    backgroundColor: '#667eea',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  typeTextActive: {
    color: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 8,
    fontWeight: '500' as const,
  },
  bankList: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  bankListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bankListItemActive: {
    backgroundColor: '#f0fdf4',
  },
  bankListText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  bankListTextActive: {
    color: '#10b981',
    fontWeight: '600' as const,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputFlex: {
    flex: 1,
  },
  verifyButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  providerSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  providerOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  providerOptionActive: {
    backgroundColor: '#667eea',
  },
  providerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  providerTextActive: {
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  restrictedAccess: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 20,
  },
  restrictedTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#f59e0b',
    marginTop: 16,
    marginBottom: 12,
  },
  restrictedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
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
  settlementCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  settlementTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  settlementInfo: {
    gap: 12,
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settlementLabel: {
    fontSize: 14,
    color: '#666',
  },
  settlementValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  historyList: {
    gap: 16,
  },
  historyItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyMonth: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  historyDetails: {
    gap: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLabel: {
    fontSize: 14,
    color: '#666',
  },
  historyValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  historyFee: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
  historyNet: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 20,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 4,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});