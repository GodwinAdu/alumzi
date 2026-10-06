import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share as RNShare, Alert, ScrollView } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Share2, QrCode, Copy, Link, Download } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';

export default function AddMemberSharePage() {
  const router = useRouter();
  const { associationId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.find((a: any) => a.id === associationId) || userAssociations?.[0];

  const [copied, setCopied] = useState(false);
  const qrRef = useRef<any>(null);

  const joinLink = `circlr://join/${selectedAssociation?.code}`;
  const joinCode = selectedAssociation?.code || '';

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied!', 'Join code copied to clipboard');
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(joinLink);
    Alert.alert('Copied!', 'Join link copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await RNShare.share({
        message: `Join ${selectedAssociation?.name} on Circlr!\n\nUse code: ${joinCode}\n\nOr click: ${joinLink}`,
        title: `Join ${selectedAssociation?.name}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Share Join Link' }} />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
          <View style={styles.header}>
            <Share2 color="#8b5cf6" size={48} />
            <Text style={styles.title}>Share Join Link</Text>
            <Text style={styles.subtitle}>
              Let members join {selectedAssociation?.name} themselves
            </Text>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <QRCode
                value={joinLink}
                size={200}
                color="#667eea"
                backgroundColor="white"
                getRef={(ref) => (qrRef.current = ref)}
              />
            </View>
            <Text style={styles.qrDescription}>
              Members can scan this QR code to join instantly
            </Text>
          </View>

          {/* Join Code Section */}
          <View style={styles.codeSection}>
            <Text style={styles.sectionTitle}>Join Code</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{joinCode}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyCode}
              >
                {copied ? (
                  <Text style={styles.copiedText}>✓ Copied</Text>
                ) : (
                  <Copy color="#667eea" size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Join Link Section */}
          <View style={styles.linkSection}>
            <Text style={styles.sectionTitle}>Join Link</Text>
            <View style={styles.linkBox}>
              <Text style={styles.linkText}>
                {joinLink}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.copyLinkButton}
              onPress={handleCopyLink}
            >
              <Copy color="#667eea" size={18} />
              <Text style={styles.copyLinkButtonText}>Copy Link</Text>
            </TouchableOpacity>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Share2 color="#fff" size={20} />
            <Text style={styles.shareButtonText}>Share via...</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Members who use this code will be added as pending members and require approval from admins.
            </Text>
          </View>
      </ScrollView>
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
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  qrSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  qrDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  codeSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#667eea',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  copiedText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  linkSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  linkBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#667eea',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  copyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4ff',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  copyLinkButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#8b5cf6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
