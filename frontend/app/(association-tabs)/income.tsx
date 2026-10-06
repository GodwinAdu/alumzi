import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, Plus, ArrowUpRight, CreditCard, Trash2, Edit3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIncomes, useDeleteIncome, useIncomeTypes, useApproveIncome } from '@/hooks/useIncomes';
import { useMembers } from '@/hooks/useMembers';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { CardSkeleton, ListItemSkeleton } from '@/components/SkeletonLoader';
import { useWebSocket } from '@/hooks/useWebSocket';

type Income = {
  id: string;
  category: string;
  amount: number;
  description: string;
  source?: string;
  paymentMethod?: string;
  recordedBy: string;
  date: string;
  isApproved: boolean;
};

export default function IncomePage() {
  const { selectedAssociation } = useAssociation();
  const { user } = useAuth();
  const privacy = usePrivacySettings();
  const socket = useWebSocket();
  const [activeTab, setActiveTab] = useState<'overview' | 'incomes' | 'types'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);
  
  const { data: incomesData, isLoading, refetch } = useIncomes(selectedAssociation?.id || '');
  const { data: membersData } = useMembers(selectedAssociation?.id || '');
  const deleteIncomeMutation = useDeleteIncome();
  const approveIncomeMutation = useApproveIncome();
  
  const incomes = (incomesData as any)?.incomes || [];
  const members = (membersData as any)?.members || [];
  const currentMember = members.find((m: any) => m.userId === user?.id);
  const userRole = currentMember?.role || 'member';
  console.log('User Role:', userRole);
  const canCreateContent = userRole !== 'member' || selectedAssociation?.settings?.financial?.allowMemberContributions;
  console.log('Can Create Content:', canCreateContent);
  console.log('Privacy Settings:', selectedAssociation?.settings?.financial);
  const currencySymbol = getCurrencySymbol(selectedAssociation?.currency || 'USD');

  useEffect(() => {
    if (selectedAssociation?.id && socket) {
      socket.emit('join-association', selectedAssociation.id);
      return () => {
        socket.emit('leave-association', selectedAssociation.id);
      };
    }
  }, [selectedAssociation?.id, socket]);

  const IncomeTypesTab = ({ associationId, canCreateContent }: { associationId: string; canCreateContent: boolean }) => {
    const { data: incomeTypesData, isLoading: typesLoading } = useIncomeTypes(associationId);
    const incomeTypes = (incomeTypesData as any)?.incomeTypes || [];

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Income Types</Text>
          {canCreateContent && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push(`/income-types?associationId=${associationId}`)}
            >
              <Plus color="#fff" size={16} />
            </TouchableOpacity>
          )}
        </View>
        {typesLoading ? (
          <>
            <ListItemSkeleton />
            <ListItemSkeleton />
          </>
        ) : incomeTypes.length === 0 ? (
          <View style={styles.emptyTypesContainer}>
            <DollarSign color="#ccc" size={48} />
            <Text style={styles.emptyTypesTitle}>No Income Types</Text>
            <Text style={styles.emptyTypesText}>Create income categories to organize your revenue</Text>
            {canCreateContent && (
              <TouchableOpacity 
                style={styles.createTypeButton}
                onPress={() => router.push(`/income-types?associationId=${associationId}`)}
              >
                <Plus color="#fff" size={16} />
                <Text style={styles.createTypeButtonText}>Create Income Type</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          incomeTypes.map((type: any) => (
            <View key={type._id} style={styles.typeCard}>
              <View style={styles.typeIcon}>
                <DollarSign color="#10b981" size={20} />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>{type.name}</Text>
                {type.description && (
                  <Text style={styles.typeDescription}>{type.description}</Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const handleRefresh = () => {
    refetch();
  };

  const confirmDelete = (incomeId: string) => {
    setIncomeToDelete(incomeId);
    setShowDeleteModal(true);
  };

  const handleDeleteIncome = async () => {
    if (!incomeToDelete) return;
    
    deleteIncomeMutation.mutate(incomeToDelete, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setIncomeToDelete(null);
      },
    });
  };

  if (!selectedAssociation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No association selected</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!privacy.canViewFinancials) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <DollarSign color="#f59e0b" size={48} />
          <Text style={styles.errorTitle}>Financial Access Restricted</Text>
          <Text style={styles.errorText}>You don't have permission to view income data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalIncome = incomes.reduce((sum: number, income: any) => sum + income.amount, 0);

  const renderOverview = () => {
    if (isLoading) {
      return (
        <View style={styles.section}>
          <CardSkeleton />
          <View style={styles.actionGrid}>
            <CardSkeleton />
            <CardSkeleton />
          </View>
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Income</Text>
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.section}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Income</Text>
          <Text style={styles.summaryAmount}>
            {currencySymbol}{totalIncome.toLocaleString()}
          </Text>
          <Text style={styles.summarySubtitle}>
            {incomes.length} income{incomes.length !== 1 ? 's' : ''} recorded
          </Text>
        </View>

        {canCreateContent && (
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push(`/record-income?associationId=${selectedAssociation.id}`)}
            >
              <DollarSign color="#10b981" size={24} />
              <Text style={styles.actionText}>Record Income</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push(`/income-types?associationId=${selectedAssociation.id}`)}
            >
              <CreditCard color="#10b981" size={24} />
              <Text style={styles.actionText}>Income Types</Text>
            </TouchableOpacity>
          </View>
        )}

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Income</Text>
        {incomes.length === 0 ? (
          <Text style={styles.emptyText}>No income recorded yet</Text>
        ) : (
          incomes.slice(0, 5).map((income: any) => (
            <View key={income.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <ArrowUpRight color="#10b981" size={18} />
              </View>
              <View style={styles.transactionContent}>
                <Text style={styles.transactionTitle}>{income.description}</Text>
                <Text style={styles.transactionCategory}>{income.category}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(income.date).toLocaleDateString()} • {income.recordedBy}
                </Text>
              </View>
              <View style={styles.transactionActions}>
                <Text style={styles.transactionAmount}>
                  +{currencySymbol}{income.amount.toLocaleString()}
                </Text>
                <View style={styles.transactionButtons}>
                  {!income.isApproved && (
                    <TouchableOpacity 
                      style={styles.transactionApproveButton}
                      onPress={() => approveIncomeMutation.mutate(income.id)}
                    >
                      <Text style={styles.approveButtonText}>✓</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.transactionEditButton}
                    onPress={() => router.push(`/edit-income?incomeId=${income.id}&associationId=${selectedAssociation.id}`)}
                  >
                    <Edit3 color="#667eea" size={14} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.transactionDeleteButton}
                    onPress={() => confirmDelete(income.id)}
                  >
                    <Trash2 color="#ef4444" size={14} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'incomes' && styles.activeTab]}
          onPress={() => setActiveTab('incomes')}
        >
          <Text style={[styles.tabText, activeTab === 'incomes' && styles.activeTabText]}>
            All Incomes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'types' && styles.activeTab]}
          onPress={() => setActiveTab('types')}
        >
          <Text style={[styles.tabText, activeTab === 'types' && styles.activeTabText]}>
            Income Types
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'incomes' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Incomes</Text>
              {canCreateContent && (
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => router.push(`/record-income?associationId=${selectedAssociation.id}`)}
                >
                  <Plus color="#fff" size={16} />
                </TouchableOpacity>
              )}
            </View>
            {isLoading ? (
              <>
                <ListItemSkeleton />
                <ListItemSkeleton />
                <ListItemSkeleton />
              </>
            ) : incomes.length === 0 ? (
              <Text style={styles.emptyText}>No incomes recorded yet</Text>
            ) : (
              incomes.map((income: any) => (
                <View key={income.id} style={styles.incomeCard}>
                  <View style={styles.incomeHeader}>
                    <View style={styles.incomeInfo}>
                      <Text style={styles.incomeTitle}>{income.description}</Text>
                      <Text style={styles.incomeCategory}>{income.category}</Text>
                      {income.source && (
                        <Text style={styles.incomeSource}>Source: {income.source}</Text>
                      )}
                    </View>
                    <View style={styles.incomeActions}>
                      <Text style={styles.incomeAmount}>+{currencySymbol}{income.amount.toLocaleString()}</Text>
                      <View style={styles.actionButtons}>
                        {!income.isApproved && (
                          <TouchableOpacity 
                            style={styles.approveButton}
                            onPress={() => approveIncomeMutation.mutate(income.id)}
                          >
                            <Text style={styles.approveButtonText}>✓</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => router.push(`/edit-income?incomeId=${income.id}&associationId=${selectedAssociation.id}`)}
                        >
                          <Edit3 color="#667eea" size={16} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => confirmDelete(income.id)}
                        >
                          <Trash2 color="#ef4444" size={16} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  <View style={styles.incomeMeta}>
                    <Text style={styles.incomeDate}>
                      {new Date(income.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.incomeRecordedBy}>by {income.recordedBy}</Text>
                    {income.paymentMethod && (
                      <Text style={styles.incomePayment}>{income.paymentMethod}</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
        {activeTab === 'types' && (
          <IncomeTypesTab associationId={selectedAssociation.id} canCreateContent={canCreateContent ?? false} />
        )}
      </ScrollView>

      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Income</Text>
            <Text style={styles.deleteModalText}>Are you sure you want to delete this income record? This action cannot be undone.</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setIncomeToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteConfirmButton}
                onPress={handleDeleteIncome}
              >
                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  activeTabText: {
    color: '#667eea',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  section: {
    gap: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#10b981',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#333',
    textAlign: 'center',
  },
  recentSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  transactionActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  transactionEditButton: {
    padding: 2,
  },
  transactionDeleteButton: {
    padding: 2,
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#10b981',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  incomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  incomeInfo: {
    flex: 1,
  },
  incomeTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  incomeCategory: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  incomeSource: {
    fontSize: 12,
    color: '#999',
  },
  incomeActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  deleteButton: {
    padding: 4,
  },
  incomeMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  incomeDate: {
    fontSize: 12,
    color: '#666',
  },
  incomeRecordedBy: {
    fontSize: 12,
    color: '#666',
  },
  incomePayment: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  manageTypesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  manageTypesText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  manageTypesSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 320,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  emptyTypesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyTypesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTypesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createTypeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  typeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: 14,
    color: '#666',
  },
  transactionApproveButton: {
    padding: 2,
    backgroundColor: '#10b981',
    borderRadius: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  approveButton: {
    padding: 6,
    backgroundColor: '#10b981',
    borderRadius: 6,
    minWidth: 24,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
});