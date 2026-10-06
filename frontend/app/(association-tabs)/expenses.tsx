import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, Tag, ArrowDownLeft, Edit3, Trash2, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses, useDeleteExpense, useExpenseTypes, useApproveExpense } from '@/hooks/useExpenses';
import { useMembers } from '@/hooks/useMembers';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { CardSkeleton, ListItemSkeleton } from '@/components/SkeletonLoader';
import { useWebSocket } from '@/hooks/useWebSocket';

type Expense = {
  id: string;
  category: string;
  amount: number;
  description: string;
  vendor?: string;
  paymentMethod?: string;
  recordedBy: string;
  date: string;
  isApproved: boolean;
};

type ExpenseType = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
};

export default function ExpensesPage() {
  const { selectedAssociation } = useAssociation();
  const { user } = useAuth();
  const privacy = usePrivacySettings();
  const socket = useWebSocket();
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'types'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  
  const { data: expensesData, isLoading, refetch } = useExpenses(selectedAssociation?.id || '');
  const { data: expenseTypesData } = useExpenseTypes(selectedAssociation?.id || '');
  const { data: membersData } = useMembers(selectedAssociation?.id || '');
  const deleteExpenseMutation = useDeleteExpense();
  const approveExpenseMutation = useApproveExpense();
  
  const expenses: Expense[] = (expensesData as any)?.expenses || [];
  const expenseTypes: ExpenseType[] = (expenseTypesData as any)?.expenseTypes || [];
  const members: any[] = (membersData as any)?.members || [];
  const currentMember = members.find((m: any) => m.userId === user?.id);
  const userRole = currentMember?.role || 'member';
  const canManageExpenses = userRole === 'admin' || userRole === 'moderator';
  const canCreateContent = userRole !== 'member' || selectedAssociation?.settings?.financial?.allowMemberContributions;
  const currencySymbol = getCurrencySymbol(selectedAssociation?.currency || 'USD');

  useEffect(() => {
    if (selectedAssociation?.id && socket) {
      socket.emit('join-association', selectedAssociation.id);
      return () => {
        socket.emit('leave-association', selectedAssociation.id);
      };
    }
  }, [selectedAssociation?.id, socket]);

  const handleRefresh = () => {
    refetch();
  };

  const confirmDelete = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setShowDeleteModal(true);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    deleteExpenseMutation.mutate(expenseToDelete, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setExpenseToDelete(null);
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
          <CreditCard color="#f59e0b" size={48} />
          <Text style={styles.errorTitle}>Financial Access Restricted</Text>
          <Text style={styles.errorText}>You don't have permission to view expense data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalExpenses = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);

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
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
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
          <Text style={styles.summaryTitle}>Total Expenses</Text>
          <Text style={styles.summaryAmount}>
            {currencySymbol}{totalExpenses.toLocaleString()}
          </Text>
          <Text style={styles.summarySubtitle}>
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
          </Text>
        </View>

        {canCreateContent && (
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push(`/record-expense?associationId=${selectedAssociation.id}`)}
            >
              <CreditCard color="#ef4444" size={24} />
              <Text style={styles.actionText}>Record Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push(`/expense-types?associationId=${selectedAssociation.id}`)}
            >
              <Tag color="#ef4444" size={24} />
              <Text style={styles.actionText}>Expense Types</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>No expenses recorded yet</Text>
          ) : (
            expenses.slice(0, 5).map((expense: Expense) => (
              <View key={expense.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <ArrowDownLeft color="#ef4444" size={18} />
                </View>
                <View style={styles.transactionContent}>
                  <Text style={styles.transactionTitle}>{expense.description}</Text>
                  <Text style={styles.transactionCategory}>{expense.category}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(expense.date).toLocaleDateString()} • {expense.recordedBy}
                  </Text>
                </View>
                <View style={styles.transactionActions}>
                  <Text style={styles.transactionAmount}>
                    -{currencySymbol}{expense.amount.toLocaleString()}
                  </Text>
                  {canManageExpenses && (
                    <View style={styles.transactionButtons}>
                      {!expense.isApproved && (
                        <TouchableOpacity 
                          style={styles.transactionApproveButton}
                          onPress={() => approveExpenseMutation.mutate(expense.id)}
                        >
                          <Text style={styles.approveButtonText}>✓</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        style={styles.transactionEditButton}
                        onPress={() => router.push(`/edit-expense?expenseId=${expense.id}&associationId=${selectedAssociation.id}` as any)}
                      >
                        <Edit3 color="#667eea" size={14} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.transactionDeleteButton}
                        onPress={() => confirmDelete(expense.id)}
                      >
                        <Trash2 color="#ef4444" size={14} />
                      </TouchableOpacity>
                    </View>
                  )}
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
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            All Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'types' && styles.activeTab]}
          onPress={() => setActiveTab('types')}
        >
          <Text style={[styles.tabText, activeTab === 'types' && styles.activeTabText]}>
            Expense Types
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'expenses' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Expenses</Text>
            {isLoading ? (
              <>
                <ListItemSkeleton />
                <ListItemSkeleton />
                <ListItemSkeleton />
              </>
            ) : expenses.length === 0 ? (
              <Text style={styles.emptyText}>No expenses recorded yet</Text>
            ) : (
              expenses.map((expense: Expense) => (
                <View key={expense.id} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <ArrowDownLeft color="#ef4444" size={18} />
                  </View>
                  <View style={styles.transactionContent}>
                    <Text style={styles.transactionTitle}>{expense.description}</Text>
                    <Text style={styles.transactionCategory}>{expense.category}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(expense.date).toLocaleDateString()} • {expense.recordedBy}
                    </Text>
                  </View>
                  <View style={styles.transactionActions}>
                    <Text style={styles.transactionAmount}>
                      -{currencySymbol}{expense.amount.toLocaleString()}
                    </Text>
                    {canManageExpenses && (
                      <View style={styles.transactionButtons}>
                        {!expense.isApproved && (
                          <TouchableOpacity 
                            style={styles.transactionApproveButton}
                            onPress={() => approveExpenseMutation.mutate(expense.id)}
                          >
                            <Text style={styles.approveButtonText}>✓</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          style={styles.transactionEditButton}
                          onPress={() => router.push(`/edit-expense?expenseId=${expense.id}&associationId=${selectedAssociation.id}` as any)}
                        >
                          <Edit3 color="#667eea" size={14} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.transactionDeleteButton}
                          onPress={() => confirmDelete(expense.id)}
                        >
                          <Trash2 color="#ef4444" size={14} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
        {activeTab === 'types' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expense Types</Text>
            {expenseTypes.length === 0 ? (
              <Text style={styles.emptyText}>No expense types configured</Text>
            ) : (
              expenseTypes.map((type: ExpenseType, index: number) => (
                <View key={type.id || `expense-type-${index}`} style={styles.typeItem}>
                  <View style={styles.typeIcon}>
                    <Tag color="#ef4444" size={20} />
                  </View>
                  <View style={styles.typeContent}>
                    <Text style={styles.typeName}>{type.name}</Text>
                    {type.description && (
                      <Text style={styles.typeDescription}>{type.description}</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Expense</Text>
            <Text style={styles.modalText}>Are you sure you want to delete this expense?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalDeleteButton}
                onPress={handleDeleteExpense}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#ef4444',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  activeTabText: {
    color: '#ef4444',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#ef4444',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#999',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  recentSection: {
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
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
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionActions: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ef4444',
    marginBottom: 4,
  },
  transactionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  transactionApproveButton: {
    backgroundColor: '#10b981',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  transactionEditButton: {
    padding: 4,
  },
  transactionDeleteButton: {
    padding: 4,
  },
  typeItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeContent: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#ef4444',
  },
  modalDeleteText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});