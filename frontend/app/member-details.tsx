import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ArrowLeft, Phone, Mail, Calendar, Crown, Shield, User, Edit3, Trash2 } from 'lucide-react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { useAssociation } from '@/contexts/AssociationContext';

export default function MemberDetailsPage() {
  const { memberId } = useLocalSearchParams();
  const { selectedAssociation } = useAssociation();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currencySymbol = getCurrencySymbol(selectedAssociation?.currency || 'USD');

  useEffect(() => {
    if (memberId) {
      fetchMemberDetails();
    }
  }, [memberId]);

  const fetchMemberDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getMemberDetails(memberId as string);
      console.log('Member details response:', response);
      setMember(response.member);
    } catch (error: any) {
      console.error('Error fetching member details:', error);
      setError(error.message || 'Failed to load member details');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown color="#f59e0b" size={20} />;
      case 'moderator':
        return <Shield color="#3b82f6" size={20} />;
      default:
        return <User color="#6b7280" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'suspended':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const handleEditMember = () => {
    router.push(`/edit-member?memberId=${memberId}`);
  };

  const handleDeleteMember = () => {
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the association?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await api.deleteMember(memberId as string);
            Alert.alert('Success', 'Member removed successfully', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to remove member');
          }
        }},
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading member details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#333" size={24} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Member Details</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Member</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMemberDetails}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#333" size={24} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Member Details</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Member Not Found</Text>
          <Text style={styles.errorMessage}>The requested member could not be found.</Text>
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
            <Text style={styles.title}>Member Details</Text>
            <Text style={styles.subtitle}>{member.name}</Text>
          </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {member.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <View style={styles.roleContainer}>
                {getRoleIcon(member.role)}
                <Text style={styles.roleText}>{member.role}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(member.status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(member.status) }]}>
                  {member.status}
                </Text>
              </View>
            </View>
            <View style={styles.profileActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleEditMember}>
                <Edit3 color="#667eea" size={20} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleDeleteMember}>
                <Trash2 color="#ef4444" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactItem}>
            <Mail color="#666" size={20} />
            <Text style={styles.contactText}>{member.email || 'No email'}</Text>
          </View>
          <View style={styles.contactItem}>
            <Phone color="#666" size={20} />
            <Text style={styles.contactText}>{member.phoneNumber || 'No phone'}</Text>
          </View>
          <View style={styles.contactItem}>
            <Calendar color="#666" size={20} />
            <Text style={styles.contactText}>
              Joined {new Date(member.joinedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.financialGrid}>
            <View style={styles.financialCard}>
              <Text style={styles.financialAmount}>{currencySymbol}{member.totalContributions?.toLocaleString() || '0'}</Text>
              <Text style={styles.financialLabel}>Total Contributions</Text>
            </View>
            <View style={styles.financialCard}>
              <Text style={styles.financialAmount}>{currencySymbol}{member.verifiedContributions?.toLocaleString() || '0'}</Text>
              <Text style={styles.financialLabel}>Verified</Text>
            </View>
            <View style={styles.financialCard}>
              <Text style={[styles.financialAmount, { color: '#f59e0b' }]}>
                {currencySymbol}{member.pendingContributions?.toLocaleString() || '0'}
              </Text>
              <Text style={styles.financialLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {member.dues && member.dues.stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dues Summary</Text>
            <View style={styles.financialGrid}>
              <View style={styles.financialCard}>
                <Text style={styles.financialAmount}>{member.dues.stats.paid}/{member.dues.stats.total}</Text>
                <Text style={styles.financialLabel}>Paid</Text>
              </View>
              <View style={styles.financialCard}>
                <Text style={[styles.financialAmount, { color: '#f59e0b' }]}>{member.dues.stats.pending}</Text>
                <Text style={styles.financialLabel}>Pending</Text>
              </View>
              <View style={styles.financialCard}>
                <Text style={[styles.financialAmount, { color: '#ef4444' }]}>{member.dues.stats.overdue}</Text>
                <Text style={styles.financialLabel}>Overdue</Text>
              </View>
            </View>
            {member.dues.recent && member.dues.recent.length > 0 && (
              <View style={{ marginTop: 15 }}>
                <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 10 }]}>Recent Dues</Text>
                {member.dues.recent.map((due: any) => (
                  <View key={due.id} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>{due.associationName}</Text>
                      <Text style={styles.transactionDate}>
                        Due: {new Date(due.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text style={styles.transactionAmountText}>
                        {getCurrencySymbol(due.currency)}{due.amount.toLocaleString()}
                      </Text>
                      <View style={[styles.transactionStatus, { 
                        backgroundColor: due.status === 'paid' ? '#10b98120' : due.status === 'overdue' ? '#ef444420' : '#f59e0b20'
                      }]}>
                        <Text style={[styles.transactionStatusText, { 
                          color: due.status === 'paid' ? '#10b981' : due.status === 'overdue' ? '#ef4444' : '#f59e0b'
                        }]}>
                          {due.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {member.recentTransactions && member.recentTransactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {member.recentTransactions.map((transaction: any) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.date).toLocaleDateString()} • {transaction.recordedBy}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[styles.transactionAmountText, { color: '#10b981' }]}>
                    +{currencySymbol}{transaction.amount.toLocaleString()}
                  </Text>
                  <View style={[styles.transactionStatus, { 
                    backgroundColor: transaction.status === 'verified' ? '#10b98120' : '#f59e0b20' 
                  }]}>
                    <Text style={[styles.transactionStatusText, { 
                      color: transaction.status === 'verified' ? '#10b981' : '#f59e0b' 
                    }]}>
                      {transaction.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.activityItem}>
            <Text style={styles.activityText}>
              Last active: {new Date(member.lastActivity).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push(`/member-statement?memberId=${memberId}`)}
          >
            <Text style={styles.primaryButtonText}>View Statement</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={async () => {
              try {
                const { chat } = await api.createDirectChat('associationId', memberId as string);
                router.push(`/chat-room?chatId=${chat._id}`);
              } catch (error) {
                console.error('Error creating direct chat:', error);
              }
            }}
          >
            <Text style={styles.secondaryButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  contactItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  financialGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  financialCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  financialAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  financialLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  activityItem: {
    paddingVertical: 8,
  },
  activityText: {
    fontSize: 16,
    color: '#64748b',
  },
  actionSection: {
    padding: 20,
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#64748b',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  transactionStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});