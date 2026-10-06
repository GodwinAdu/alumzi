import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Users, Check, X, Clock } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useAssociation } from '@/contexts/AssociationContext';

type PendingRequest = {
  id: string;
  user: {
    id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
  };
  requestedAt: string;
};

export default function PendingRequestsPage() {
  const router = useRouter();
  const { associationId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.find(assoc => assoc.id === associationId);
  
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  useEffect(() => {
    loadPendingRequests();
  }, [associationId]);

  const loadPendingRequests = async () => {
    if (!associationId) return;
    
    try {
      const response = await apiService.getPendingRequests(associationId as string);
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Failed to load pending requests:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPendingRequests();
  };

  const handleApprove = async (memberId: string, userName: string) => {
    Alert.alert(
      'Approve Request',
      `Approve ${userName} to join the association?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setProcessingIds(prev => [...prev, memberId]);
            try {
              await apiService.approveMemberRequest(associationId as string, memberId);
              setRequests(prev => prev.filter(req => req.id !== memberId));
              Alert.alert('Success', `${userName} has been approved`);
            } catch (error) {
              Alert.alert('Error', 'Failed to approve request');
            } finally {
              setProcessingIds(prev => prev.filter(id => id !== memberId));
            }
          },
        },
      ]
    );
  };

  const handleReject = async (memberId: string, userName: string) => {
    Alert.alert(
      'Reject Request',
      `Reject ${userName}'s request to join?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingIds(prev => [...prev, memberId]);
            try {
              await apiService.rejectMemberRequest(associationId as string, memberId);
              setRequests(prev => prev.filter(req => req.id !== memberId));
              Alert.alert('Success', `${userName}'s request has been rejected`);
            } catch (error) {
              Alert.alert('Error', 'Failed to reject request');
            } finally {
              setProcessingIds(prev => prev.filter(id => id !== memberId));
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Pending Requests',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#667eea', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        )
      }} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Join Requests</Text>
          <Text style={styles.subtitle}>{selectedAssociation?.name}</Text>
        </View>

        <ScrollView 
          style={styles.requestsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Users color="#ccc" size={48} />
              <Text style={styles.emptyTitle}>No Pending Requests</Text>
              <Text style={styles.emptyText}>
                All join requests have been processed
              </Text>
            </View>
          ) : (
            requests.map(request => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {request.user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.userName}>{request.user.name}</Text>
                    {request.user.email && (
                      <Text style={styles.userContact}>{request.user.email}</Text>
                    )}
                    {request.user.phoneNumber && (
                      <Text style={styles.userContact}>{request.user.phoneNumber}</Text>
                    )}
                    <View style={styles.requestMeta}>
                      <Clock color="#999" size={12} />
                      <Text style={styles.requestDate}>
                        Requested {formatDate(request.requestedAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(request.id, request.user.name)}
                    disabled={processingIds.includes(request.id)}
                  >
                    <X color="#ef4444" size={16} />
                    <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
                      Reject
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(request.id, request.user.name)}
                    disabled={processingIds.includes(request.id)}
                  >
                    <Check color="#10b981" size={16} />
                    <Text style={[styles.actionButtonText, styles.approveButtonText]}>
                      Approve
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
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
    color: '#667eea',
    fontWeight: '600' as const,
  },
  requestsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  requestInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  approveButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  approveButtonText: {
    color: '#10b981',
  },
  rejectButtonText: {
    color: '#ef4444',
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
  },
});