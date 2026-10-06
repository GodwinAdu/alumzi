import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function TermsOfServicePage() {
  const router = useRouter();

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
        <Text style={styles.title}>Terms of Service</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: December 15, 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using Alumzi ("the Service"), you accept and agree to be bound by the 
            terms and provision of this agreement. If you do not agree to abide by the above, 
            please do not use this service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            Alumzi is a platform that enables users to create, join, and manage school and community 
            associations. The Service includes features for:
          </Text>
          <Text style={styles.bulletPoint}>• Association creation and management</Text>
          <Text style={styles.bulletPoint}>• Member management and communication</Text>
          <Text style={styles.bulletPoint}>• Financial tracking and reporting</Text>
          <Text style={styles.bulletPoint}>• Event organization and coordination</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            To use certain features of the Service, you must register for an account. You agree to:
          </Text>
          <Text style={styles.bulletPoint}>• Provide accurate and complete information</Text>
          <Text style={styles.bulletPoint}>• Maintain the security of your account credentials</Text>
          <Text style={styles.bulletPoint}>• Notify us immediately of any unauthorized use</Text>
          <Text style={styles.bulletPoint}>• Be responsible for all activities under your account</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
          <Text style={styles.paragraph}>
            You agree not to use the Service to:
          </Text>
          <Text style={styles.bulletPoint}>• Violate any applicable laws or regulations</Text>
          <Text style={styles.bulletPoint}>• Infringe on the rights of others</Text>
          <Text style={styles.bulletPoint}>• Transmit harmful, offensive, or inappropriate content</Text>
          <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to our systems</Text>
          <Text style={styles.bulletPoint}>• Use the Service for commercial purposes without permission</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Association Management</Text>
          <Text style={styles.paragraph}>
            As an association administrator, you are responsible for:
          </Text>
          <Text style={styles.bulletPoint}>• Managing member access and permissions appropriately</Text>
          <Text style={styles.bulletPoint}>• Ensuring financial records are accurate and up-to-date</Text>
          <Text style={styles.bulletPoint}>• Complying with applicable laws regarding association management</Text>
          <Text style={styles.bulletPoint}>• Respecting member privacy and data protection rights</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Financial Transactions</Text>
          <Text style={styles.paragraph}>
            When using financial features of the Service:
          </Text>
          <Text style={styles.bulletPoint}>• All financial information must be accurate and truthful</Text>
          <Text style={styles.bulletPoint}>• You are responsible for compliance with tax and reporting requirements</Text>
          <Text style={styles.bulletPoint}>• We are not responsible for financial decisions made using the Service</Text>
          <Text style={styles.bulletPoint}>• Disputes regarding financial matters should be resolved within your association</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Privacy and Data Protection</Text>
          <Text style={styles.paragraph}>
            Your privacy is important to us. Our collection and use of personal information is 
            governed by our Privacy Policy, which is incorporated into these Terms by reference.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            The Service and its original content, features, and functionality are owned by Alumzi 
            and are protected by international copyright, trademark, patent, trade secret, and 
            other intellectual property laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Disclaimers and Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            The Service is provided "as is" without warranties of any kind. We shall not be liable 
            for any indirect, incidental, special, consequential, or punitive damages resulting 
            from your use of the Service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Termination</Text>
          <Text style={styles.paragraph}>
            We may terminate or suspend your account and access to the Service immediately, without 
            prior notice, for conduct that we believe violates these Terms or is harmful to other 
            users, us, or third parties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these Terms at any time. We will notify users of any 
            material changes. Your continued use of the Service after such modifications constitutes 
            acceptance of the updated Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms shall be governed by and construed in accordance with the laws of the 
            jurisdiction in which Alumzi operates, without regard to conflict of law principles.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms of Service, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>Email: legal@alumzi.com</Text>
          <Text style={styles.contactInfo}>Phone: +1 (555) 123-4567</Text>
          <Text style={styles.contactInfo}>Address: 123 Legal Street, Terms City, TC 12345</Text>
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
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
    marginLeft: 8,
  },
  contactInfo: {
    fontSize: 15,
    color: '#667eea',
    lineHeight: 22,
    marginBottom: 4,
    fontWeight: '500' as const,
  },
});