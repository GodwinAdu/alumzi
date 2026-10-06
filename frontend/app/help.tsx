import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Share, Clipboard } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle, Mail, Phone, FileText, ExternalLink, ChevronRight, ChevronDown, ChevronUp, Star, Send, Crown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

export default function HelpPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { limits, plan } = useSubscription();
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);
  const [feedbackSent, setFeedbackSent] = React.useState(false);

  const contactOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: limits.hasPrioritySupport 
        ? 'Priority support - Chat with our team'
        : 'Chat with our support team',
      priority: limits.hasPrioritySupport,
      onPress: () => {
        const message = limits.hasPrioritySupport
          ? 'Enterprise Priority Support - Our team is available 24/7 for Enterprise customers. Would you like to start a priority chat session?'
          : 'Our support team is available Monday-Friday, 9 AM - 6 PM EST. Would you like to start a chat session?';
        
        Alert.alert(
          'Live Chat',
          message,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Start Chat', onPress: () => Alert.alert('Connecting...', 'Please wait while we connect you to a support agent.') }
          ]
        );
      },
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: limits.hasPrioritySupport 
        ? 'priority@alumzi.com (24h response)'
        : 'support@alumzi.com',
      priority: limits.hasPrioritySupport,
      onPress: () => {
        const email = limits.hasPrioritySupport ? 'priority@alumzi.com' : 'support@alumzi.com';
        const subject = limits.hasPrioritySupport 
          ? '[PRIORITY] Support Request - Alumzi App'
          : 'Support Request - Alumzi App';
        const body = `Hi Alumzi Support Team,\n\n${limits.hasPrioritySupport ? 'PRIORITY SUPPORT REQUEST\n' : ''}User: ${user?.name || 'Unknown'}\nEmail: ${user?.email || user?.phoneNumber || 'Unknown'}\nPlan: ${plan.toUpperCase()}\n\nIssue Description:\n\n\nSteps to Reproduce:\n1. \n2. \n3. \n\nExpected Behavior:\n\n\nActual Behavior:\n\n\nDevice Information:\n- Platform: Mobile App\n- Version: 1.0.0\n\nThank you for your assistance.`;
        Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      },
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: limits.hasPrioritySupport 
        ? '+1 (555) 123-4567 (24/7 priority line)'
        : limits.hasEmailNotifications 
          ? '+1 (555) 123-4567 (business hours)'
          : 'Available on Pro and Enterprise plans',
      priority: limits.hasPrioritySupport,
      restricted: !limits.hasEmailNotifications,
      onPress: () => {
        if (!limits.hasEmailNotifications) {
          Alert.alert(
            'Upgrade Required',
            'Phone support is available on Pro and Enterprise plans.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Upgrade', onPress: () => router.push('/subscription-settings') }
            ]
          );
          return;
        }
        
        const message = limits.hasPrioritySupport
          ? 'Enterprise Priority Support - Our phone support is available 24/7 for Enterprise customers. Call now?'
          : 'Phone support is available Monday-Friday, 9 AM - 6 PM EST. Call now?';
        
        Alert.alert(
          'Call Support',
          message,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Copy Number', onPress: () => {
              Clipboard.setString('+15551234567');
              Alert.alert('Copied', 'Phone number copied to clipboard');
            }},
            { text: 'Call Now', onPress: () => Linking.openURL('tel:+15551234567') }
          ]
        );
      },
    },
  ];

  const resourceOptions = [
    {
      icon: FileText,
      title: 'User Guide',
      description: 'Learn how to use Alumzi',
      onPress: () => {
        Alert.alert(
          'User Guide',
          'Choose how you\'d like to access the user guide:',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'View Online', onPress: () => Linking.openURL('https://alumzi.com/guide') },
            { text: 'Download PDF', onPress: () => Alert.alert('Download Started', 'User guide PDF is being downloaded.') }
          ]
        );
      },
    },
    {
      icon: FileText,
      title: 'Privacy Policy',
      description: 'Read our privacy policy',
      onPress: () => router.push('/privacy-policy'),
    },
    {
      icon: FileText,
      title: 'Terms of Service',
      description: 'Read our terms of service',
      onPress: () => router.push('/terms-of-service'),
    },
    {
      icon: ExternalLink,
      title: 'Community Forum',
      description: 'Join discussions with other users',
      onPress: () => Linking.openURL('https://community.alumzi.com'),
    },
  ];

  const faqItems = [
    {
      question: 'How do I create an association?',
      answer: 'Go to the Associations tab and tap "Create Association". Fill in the required information including name, type (school or community), and location. Your association will be created with a unique code that others can use to join.',
    },
    {
      question: 'How do I join an existing association?',
      answer: 'You can join an association by entering the association code or searching for it by name in the Join Association section. Some associations require approval from administrators.',
    },
    {
      question: 'How do I enable two-factor authentication?',
      answer: 'Go to Settings > Security > Two-Factor Authentication and follow the setup process. You\'ll scan a QR code with an authenticator app and verify with a code to secure your account.',
    },
    {
      question: 'Can I manage multiple associations?',
      answer: 'Yes, you can be a member of multiple associations and switch between them easily from the associations list. Each association has its own settings and data.',
    },
    {
      question: 'How do I manage finances in my association?',
      answer: 'Admins and moderators can access financial features to track income, expenses, and member contributions. Go to the Finances tab to manage transactions and view reports.',
    },
    {
      question: 'What are the different member roles?',
      answer: 'There are three roles: Admin (full access), Moderator (limited management), and Member (view-only). Admins can change member roles and manage association settings.',
    },
    {
      question: 'How do I reset my password?',
      answer: 'Alumzi uses OTP (One-Time Password) authentication. Simply enter your email or phone number on the sign-in screen to receive a new verification code.',
    },
    {
      question: 'Can I export my association data?',
      answer: 'Yes, admins can export association data including member lists, financial records, and transaction history from the association settings page.',
    },
  ];

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const sendFeedback = () => {
    Alert.alert(
      'Send Feedback',
      'Help us improve Alumzi! What type of feedback would you like to share?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Bug Report', onPress: () => reportBug() },
        { text: 'Feature Request', onPress: () => requestFeature() },
        { text: 'General Feedback', onPress: () => generalFeedback() }
      ]
    );
  };

  const reportBug = () => {
    const subject = 'Bug Report - Alumzi App';
    const body = `Bug Report\n\nUser: ${user?.name || 'Unknown'}\nEmail: ${user?.email || user?.phoneNumber || 'Unknown'}\n\nBug Description:\n\n\nSteps to Reproduce:\n1. \n2. \n3. \n\nExpected Behavior:\n\n\nActual Behavior:\n\n`;
    Linking.openURL(`mailto:bugs@alumzi.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const requestFeature = () => {
    const subject = 'Feature Request - Alumzi App';
    const body = `Feature Request\n\nUser: ${user?.name || 'Unknown'}\nEmail: ${user?.email || user?.phoneNumber || 'Unknown'}\n\nFeature Description:\n\n\nUse Case:\n\n\nBenefit:\n\n`;
    Linking.openURL(`mailto:feedback@alumzi.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const generalFeedback = () => {
    const subject = 'General Feedback - Alumzi App';
    const body = `General Feedback\n\nUser: ${user?.name || 'Unknown'}\nEmail: ${user?.email || user?.phoneNumber || 'Unknown'}\n\nFeedback:\n\n`;
    Linking.openURL(`mailto:feedback@alumzi.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareApp = () => {
    Share.share({
      message: 'Check out Alumzi - the best app for managing school and community associations! Download it now: https://alumzi.com/download',
      title: 'Alumzi - Association Management App'
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#667eea" size={20} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <View style={styles.optionsList}>
            {contactOptions.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.optionItem,
                  index === contactOptions.length - 1 && styles.lastItem,
                  option.priority && styles.priorityItem,
                  option.restricted && styles.restrictedItem
                ]}
                onPress={option.onPress}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIcon, option.priority && styles.priorityIcon]}>
                    <option.icon color={option.priority ? "#f59e0b" : option.restricted ? "#ccc" : "#667eea"} size={20} />
                  </View>
                  <View style={styles.optionContent}>
                    <View style={styles.optionTitleRow}>
                      <Text style={[styles.optionTitle, option.restricted && styles.restrictedTitle]}>
                        {option.title}
                      </Text>
                      {option.priority && <Crown color="#f59e0b" size={16} />}
                    </View>
                    <Text style={[styles.optionDescription, option.restricted && styles.restrictedDescription]}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                <ChevronRight color="#999" size={20} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <View style={styles.optionsList}>
            {resourceOptions.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.optionItem,
                  index === resourceOptions.length - 1 && styles.lastItem
                ]}
                onPress={option.onPress}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.optionIcon}>
                    <option.icon color="#667eea" size={20} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </View>
                <ChevronRight color="#999" size={20} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {faqItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.faqItem, index === faqItems.length - 1 && styles.lastFaqItem]}
                onPress={() => toggleFaq(index)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  {expandedFaq === index ? (
                    <ChevronUp color="#667eea" size={20} />
                  ) : (
                    <ChevronDown color="#667eea" size={20} />
                  )}
                </View>
                {expandedFaq === index && (
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback & Support</Text>
          <View style={styles.optionsList}>
            <TouchableOpacity style={styles.optionItem} onPress={sendFeedback}>
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <Send color="#667eea" size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Send Feedback</Text>
                  <Text style={styles.optionDescription}>Report bugs or suggest features</Text>
                </View>
              </View>
              <ChevronRight color="#999" size={20} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={shareApp}>
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <Star color="#667eea" size={20} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Share Alumzi</Text>
                  <Text style={styles.optionDescription}>Tell others about the app</Text>
                </View>
              </View>
              <ChevronRight color="#999" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.infoCard, limits.hasPrioritySupport && styles.priorityInfoCard]}>
          <Text style={[styles.infoTitle, limits.hasPrioritySupport && styles.priorityInfoTitle]}>
            {limits.hasPrioritySupport ? 'Enterprise Priority Support' : 'Need More Help?'}
          </Text>
          <Text style={[styles.infoText, limits.hasPrioritySupport && styles.priorityInfoText]}>
            {limits.hasPrioritySupport 
              ? 'As an Enterprise customer, you have access to 24/7 priority support with guaranteed response times. Our dedicated team is here to ensure your success.'
              : 'Our support team is here to help you get the most out of Alumzi. Don\'t hesitate to reach out if you have any questions or need assistance.'
            }
          </Text>
          {!limits.hasPrioritySupport && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => router.push('/subscription-settings')}
            >
              <Crown color="#fff" size={16} />
              <Text style={styles.upgradeButtonText}>Upgrade for Priority Support</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    padding: 24,
    paddingBottom: 16,
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
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  optionsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  faqList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lastFaqItem: {
    borderBottomWidth: 0,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
    paddingRight: 32,
  },
  infoCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#4338ca',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4338ca',
    lineHeight: 20,
  },
  priorityItem: {
    backgroundColor: '#fffbeb',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  restrictedItem: {
    opacity: 0.6,
  },
  priorityIcon: {
    backgroundColor: '#fef3c7',
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  restrictedTitle: {
    color: '#999',
  },
  restrictedDescription: {
    color: '#999',
  },
  priorityInfoCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  priorityInfoTitle: {
    color: '#92400e',
  },
  priorityInfoText: {
    color: '#92400e',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});