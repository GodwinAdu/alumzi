import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Plus, Edit3, Trash2, Tag, Lock } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useExpenseTypes, useCreateExpenseType } from '@/hooks/useExpenses';
import { useMembers } from '@/hooks/useMembers';

type ExpenseType = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
};

export default function ExpenseTypesPage() {
  const router = useRouter();
  const { associationId } = useLocalSearchParams();
  const { selectedAssociation } = useAssociation();
  const { user } = useAuth();
  const { limits, plan } = useSubscription();
  
  const { data: expenseTypesData, isLoading } = useExpenseTypes(associationId as string);
  const { data: membersData } = useMembers(associationId as string);
  const createExpenseTypeMutation = useCreateExpenseType();
  
  let expenseTypes = expenseTypesData?.expenseTypes || [];
  
  // Add default types for free users if no custom types exist
  if (!limits.hasCustomTypes && expenseTypes.length === 0) {
    expenseTypes = [
      { _id: 'default-1', name: 'Operating Expenses', description: 'General operational costs and utilities', isActive: true },
      { _id: 'default-2', name: 'Other Expenses', description: 'Miscellaneous expenses and costs', isActive: true }
    ];
  }
  
  const members = membersData?.members || [];
  const currentMember = members.find(m => m.userId === user?.id);
  const userRole = currentMember?.role || 'member';
  const canManageTypes = userRole === 'admin' || userRole === 'moderator';
  
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<ExpenseType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);



  const openModal = (type?: ExpenseType) => {
    if (!limits.hasCustomTypes) {
      Alert.alert(
        'Upgrade Required',
        'Custom expense types are available on Pro and Enterprise plans.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/subscription-settings') }
        ]
      );
      return;
    }
    
    if (type) {
      setEditingType(type);
      setName(type.name);
      setDescription(type.description || '');
    } else {
      setEditingType(null);
      setName('');
      setDescription('');
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingType(null);
    setName('');
    setDescription('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingType) {
        await api.updateExpenseType(associationId as string, editingType.id, {
          name: name.trim(),
          description: description.trim() || undefined
        });
        Alert.alert('Success', 'Expense type updated successfully');
        closeModal();
        // Refetch expense types
        window.location.reload();
      } else {
        createExpenseTypeMutation.mutate({
          associationId: associationId as string,
          data: {
            name: name.trim(),
            description: description.trim() || undefined
          }
        }, {
          onSuccess: () => {
            closeModal();
          },
          onError: () => {
            Alert.alert('Error', 'Failed to create expense type');
          }
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save expense type');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (type: ExpenseType) => {
    Alert.alert(
      'Delete Expense Type',
      `Are you sure you want to delete "${type.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteExpenseType(associationId as string, type.id);
              Alert.alert('Success', 'Expense type deleted successfully');
              // Refetch expense types
              window.location.reload();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete expense type');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Expense Types',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#667eea', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        ),
        headerRight: () => canManageTypes ? (
          <TouchableOpacity onPress={() => openModal()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Plus color={limits.hasCustomTypes ? "#667eea" : "#ccc"} size={24} />
              {!limits.hasCustomTypes && <Lock color="#f59e0b" size={16} />}
            </View>
          </TouchableOpacity>
        ) : null
      }} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Expense Categories</Text>
          <Text style={styles.subtitle}>{selectedAssociation?.name}</Text>
        </View>

        {!canManageTypes ? (
          <View style={styles.restrictedAccess}>
            <Lock color="#f59e0b" size={48} />
            <Text style={styles.restrictedTitle}>View Only Access</Text>
            <Text style={styles.restrictedText}>
              You can view expense types but cannot modify them. Only admins and moderators can manage expense types.
            </Text>
          </View>
        ) : !limits.hasCustomTypes && expenseTypes.length > 0 ? (
          <View style={styles.upgradePrompt}>
            <Lock color="#f59e0b" size={48} />
            <Text style={styles.upgradeTitle}>Using Default Categories</Text>
            <Text style={styles.upgradeText}>
              You have 2 default expense categories. Upgrade to create unlimited custom categories.
            </Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => router.push('/subscription-settings')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to {plan === 'free' ? 'Pro' : 'Enterprise'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <ScrollView style={styles.typesList}>
          {expenseTypes.length === 0 ? (
            <View style={styles.emptyState}>
              <Tag color="#ccc" size={48} />
              <Text style={styles.emptyTitle}>No Expense Types</Text>
              <Text style={styles.emptyText}>
                {limits.hasCustomTypes 
                  ? 'Create expense categories to organize your spending'
                  : 'Using default expense categories. Upgrade to create custom types.'
                }
              </Text>
              {canManageTypes && limits.hasCustomTypes && (
                <TouchableOpacity style={styles.createButton} onPress={() => openModal()}>
                  <Plus color="#fff" size={20} />
                  <Text style={styles.createButtonText}>Create First Type</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            expenseTypes.map((type: any) => (
              <View key={type._id} style={styles.typeCard}>
                <View style={styles.typeIcon}>
                  <Tag color="#ef4444" size={20} />
                </View>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeName}>{type.name}</Text>
                  {type.description && (
                    <Text style={styles.typeDescription}>{type.description}</Text>
                  )}
                </View>
                {canManageTypes && limits.hasCustomTypes && !type._id.startsWith('default-') && (
                  <View style={styles.typeActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openModal(type)}
                    >
                      <Edit3 color="#666" size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(type)}
                    >
                      <Trash2 color="#ef4444" size={16} />
                    </TouchableOpacity>
                  </View>
                )}
                {type._id.startsWith('default-') && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>

        <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingType ? 'Edit' : 'Create'} Expense Type
              </Text>
              <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                <Text style={[styles.modalSave, isSaving && styles.modalSaveDisabled]}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Office Supplies"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Optional description..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600' as const,
  },
  typesList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  typeCard: {
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
  typeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
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
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  modalSave: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600' as const,
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    padding: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  restrictedAccess: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 24,
  },
  restrictedTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#f59e0b',
    marginTop: 16,
    marginBottom: 8,
  },
  restrictedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  upgradePrompt: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 24,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
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
  defaultBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600' as const,
  },
});