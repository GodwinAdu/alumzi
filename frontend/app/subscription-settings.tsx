import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, ArrowLeft, Check, Users, DollarSign, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { api } from '@/lib/api';

interface Subscription {
  id: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  memberLimit: number;
  currentMembers: number;
  features: string[];
  expiresAt?: string;
}

const PLAN_FEATURES = {
  free: [
    'Up to 50 members',
    'Basic financial tracking',
    'Member management',
    'Basic reports'
  ],
  pro: [
    'Up to 200 members',
    'Advanced financial tracking',
    'Custom expense/income types',
    'Advanced reports & analytics',
    'Payment processing',
    'Email notifications'
  ],
  enterprise: [
    'Unlimited members',
    'All Pro features',
    'Priority support',
    'Custom integrations',
    'Advanced security',
    'Dedicated account manager'
  ]
};

const PLAN_PRICES = {
  free: 0,
  pro: 1500, // Monthly in pesewas (15 GHS)
  enterprise: 6000 // Monthly in pesewas (60 GHS)
};

export default function SubscriptionSettingsPage() {
  const { selectedAssociation } = useAssociation();
  const { user } = useAuth();
  const { data: membersData } = useMembers(selectedAssociation?.id || '');
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const members = membersData?.members || [];
  const currentMember = members.find(m => m.userId === user?.id);
  const userRole = currentMember?.role || 'member';
  const canManageSubscription = userRole === 'admin';

  useEffect(() => {
    if (selectedAssociation?.id) {
      loadSubscription();
    }
  }, [selectedAssociation?.id]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.getSubscription(selectedAssociation?.id || '');
      setSubscription(response.subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
      // Set default free plan if no subscription found
      setSubscription({
        id: 'free',
        plan: 'free',
        status: 'active',
        memberLimit: 50,
        currentMembers: members.length,
        features: PLAN_FEATURES.free
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
    if (!canManageSubscription) {
      Alert.alert('Error', 'Only admins can manage subscriptions');
      return;
    }

    Alert.alert(
      'Upgrade Plan',
      `Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan for GH₵${PLAN_PRICES[plan] / 100}/month?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Payment',
          onPress: async () => {
            try {
              const response = await api.upgradePlan(
                selectedAssociation?.id || '',
                plan
              );
              
              // Open Paystack payment URL in WebView
              if (response.authorization_url) {
                router.push({
                  pathname: '/payment-webview',
                  params: {
                    url: response.authorization_url,
                    reference: response.reference,
                    returnPath: '/subscription-settings'
                  }
                });
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to initialize upgrade');
            }
          }
        }
      ]
    );
  };

  const handlePaymentCallback = async (reference: string) => {
    try {
      await api.confirmUpgrade(reference);
      Alert.alert('Success', 'Plan upgraded successfully!');
      loadSubscription();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to confirm upgrade');
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return '#6b7280';
      case 'pro': return '#667eea';
      case 'enterprise': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'free': return Users;
      case 'pro': return Crown;
      case 'enterprise': return Zap;
      default: return Users;
    }
  };

  if (!selectedAssociation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Crown color="#ccc" size={48} />
          <Text style={styles.emptyTitle}>No Association Selected</Text>
          <Text style={styles.emptyText}>Please select an association to view subscription</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#667eea" size={20} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Subscription Plan</Text>
          <Text style={styles.subtitle}>{selectedAssociation.name}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading subscription...</Text>
          </View>
        ) : (
          <>
            {subscription && (
              <View style={styles.currentPlanCard}>
                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: `${getPlanColor(subscription.plan)}20` }]}>
                    {React.createElement(getPlanIcon(subscription.plan), {
                      color: getPlanColor(subscription.plan),
                      size: 24
                    })}
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.currentPlanTitle}>Current Plan</Text>
                    <Text style={[styles.planName, { color: getPlanColor(subscription.plan) }]}>
                      {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                    </Text>
                    <Text style={styles.planStatus}>
                      Status: {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.planPrice}>
                    <Text style={styles.priceAmount}>
                      GH₵{PLAN_PRICES[subscription.plan] / 100}
                    </Text>
                    <Text style={styles.priceUnit}>/month</Text>
                  </View>
                </View>

                <View style={styles.usageInfo}>
                  <View style={styles.usageItem}>
                    <Text style={styles.usageLabel}>Members</Text>
                    <Text style={styles.usageValue}>
                      {subscription.currentMembers} / {subscription.memberLimit === -1 ? '∞' : subscription.memberLimit}
                    </Text>
                  </View>
                  {subscription.expiresAt && (
                    <View style={styles.usageItem}>
                      <Text style={styles.usageLabel}>Expires</Text>
                      <Text style={styles.usageValue}>
                        {new Date(subscription.expiresAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.featuresSection}>
                  <Text style={styles.featuresTitle}>Included Features</Text>
                  {subscription.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Check color="#10b981" size={16} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {canManageSubscription && subscription?.plan !== 'enterprise' && (
              <View style={styles.upgradeSection}>
                <Text style={styles.sectionTitle}>Available Plans</Text>
                
                {subscription?.plan === 'free' && (
                  <View style={styles.planCard}>
                    <View style={styles.planCardHeader}>
                      <Crown color="#667eea" size={24} />
                      <View style={styles.planCardInfo}>
                        <Text style={styles.planCardName}>Pro Plan</Text>
                        <Text style={styles.planCardPrice}>GH₵15/month</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.upgradeButton}
                        onPress={() => handleUpgrade('pro')}
                      >
                        <Text style={styles.upgradeButtonText}>Upgrade</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.planCardFeatures}>
                      {PLAN_FEATURES.pro.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <Check color="#10b981" size={14} />
                          <Text style={styles.featureTextSmall}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.planCard}>
                  <View style={styles.planCardHeader}>
                    <Zap color="#f59e0b" size={24} />
                    <View style={styles.planCardInfo}>
                      <Text style={styles.planCardName}>Enterprise Plan</Text>
                      <Text style={styles.planCardPrice}>GH₵60/month</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.upgradeButton}
                      onPress={() => handleUpgrade('enterprise')}
                    >
                      <Text style={styles.upgradeButtonText}>Upgrade</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.planCardFeatures}>
                    {PLAN_FEATURES.enterprise.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Check color="#10b981" size={14} />
                        <Text style={styles.featureTextSmall}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {!canManageSubscription && (
              <View style={styles.restrictedAccess}>
                <Crown color="#f59e0b" size={48} />
                <Text style={styles.restrictedTitle}>Admin Access Required</Text>
                <Text style={styles.restrictedText}>
                  Only association admins can manage subscription plans
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  currentPlanCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  currentPlanTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  planStatus: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500' as const,
  },
  planPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1a1a1a',
  },
  priceUnit: {
    fontSize: 12,
    color: '#666',
  },
  usageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 20,
  },
  usageItem: {
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  featuresSection: {
    marginTop: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
  },
  featureTextSmall: {
    fontSize: 12,
    color: '#666',
  },
  upgradeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  planCardName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  planCardPrice: {
    fontSize: 14,
    color: '#666',
  },
  upgradeButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  planCardFeatures: {
    paddingLeft: 36,
  },
  restrictedAccess: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
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
});