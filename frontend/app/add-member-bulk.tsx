import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Upload, FileSpreadsheet, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAssociation } from '@/contexts/AssociationContext';
import { api } from '@/lib/api';

interface ParsedMember {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export default function AddMemberBulkPage() {
  const router = useRouter();
  const { associationId } = useLocalSearchParams();
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.find(a => a.id === associationId) || userAssociations?.[0];

  const [file, setFile] = useState<any>(null);
  const [parsedData, setParsedData] = useState<ParsedMember[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const pickedFile = result.assets[0];
      setFile(pickedFile);
      parseCSV(pickedFile);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const parseCSV = async (pickedFile: any) => {
    setParsing(true);
    try {
      const response = await fetch(pickedFile.uri);
      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        Alert.alert('Error', 'CSV file must have headers and at least one row');
        return;
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const phoneIdx = headers.findIndex(h => h.includes('phone'));
      const roleIdx = headers.findIndex(h => h.includes('role'));

      if (nameIdx === -1) {
        Alert.alert('Error', 'CSV must have a "name" column');
        return;
      }

      const members: ParsedMember[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const member: ParsedMember = {
          name: values[nameIdx] || '',
          email: emailIdx !== -1 ? values[emailIdx] : undefined,
          phone: phoneIdx !== -1 ? values[phoneIdx] : undefined,
          role: roleIdx !== -1 ? values[roleIdx] : 'member',
        };
        if (member.name) members.push(member);
      }

      setParsedData(members);
      Alert.alert('Success', `Parsed ${members.length} members from CSV`);
    } catch (error) {
      Alert.alert('Error', 'Failed to parse CSV file');
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      Alert.alert('Error', 'No data to upload');
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`${api.baseURL}/member-management/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await api.getToken()}`,
        },
        body: JSON.stringify({
          associationId: selectedAssociation?.id,
          fileName: file?.name || 'bulk-import.csv',
          members: parsedData,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setJobId(data.jobId);
        pollJobStatus(data.jobId);
      } else {
        Alert.alert('Error', data.message || 'Upload failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload data');
    } finally {
      setUploading(false);
    }
  };

  const pollJobStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${api.baseURL}/member-management/bulk-import/${id}`, {
          headers: {
            'Authorization': `Bearer ${await api.getToken()}`,
          },
        });
        const data = await response.json();
        
        if (data.success) {
          setJobStatus(data.job);
          if (data.job.status === 'completed' || data.job.status === 'failed') {
            clearInterval(interval);
            if (data.job.status === 'completed') {
              Alert.alert(
                'Import Complete',
                `Success: ${data.job.successCount}\nFailed: ${data.job.failureCount}\nDuplicates: ${data.job.duplicateCount}`,
                [{ text: 'OK', onPress: () => router.back() }]
              );
            }
          }
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 2000);
  };

  const downloadTemplate = () => {
    Alert.alert(
      'CSV Template',
      'Create a CSV file with these columns:\n\nname,email,phone,role\n\nExample:\nJohn Doe,john@example.com,+1234567890,member',
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Bulk Import' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Upload color="#10b981" size={48} />
          <Text style={styles.title}>Bulk Import Members</Text>
          <Text style={styles.subtitle}>Import 100+ members from CSV</Text>
        </View>

        {!file ? (
          <>
            <TouchableOpacity style={styles.templateButton} onPress={downloadTemplate}>
              <Download color="#667eea" size={20} />
              <Text style={styles.templateButtonText}>Download CSV Template</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadButton} onPress={handlePickFile}>
              <FileSpreadsheet color="#fff" size={24} />
              <Text style={styles.uploadButtonText}>Select CSV File</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>📋 CSV Format</Text>
              <Text style={styles.infoText}>
                Required: name{"\n"}
                Optional: email, phone, role{"\n\n"}
                Example:{"\n"}
                name,email,phone,role{"\n"}
                John Doe,john@example.com,+1234567890,member
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.fileCard}>
              <FileSpreadsheet color="#10b981" size={32} />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{file.name}</Text>
                <Text style={styles.fileSize}>{parsedData.length} members parsed</Text>
              </View>
            </View>

            {parsing && (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#10b981" />
                <Text style={styles.loadingText}>Parsing CSV...</Text>
              </View>
            )}

            {jobStatus && (
              <View style={styles.statusCard}>
                <Text style={styles.statusTitle}>Import Progress</Text>
                <View style={styles.statusRow}>
                  <CheckCircle color="#10b981" size={20} />
                  <Text style={styles.statusText}>Success: {jobStatus.successCount}</Text>
                </View>
                <View style={styles.statusRow}>
                  <XCircle color="#ef4444" size={20} />
                  <Text style={styles.statusText}>Failed: {jobStatus.failureCount}</Text>
                </View>
                <View style={styles.statusRow}>
                  <AlertCircle color="#f59e0b" size={20} />
                  <Text style={styles.statusText}>Duplicates: {jobStatus.duplicateCount}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${(jobStatus.processedRecords / jobStatus.totalRecords) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {jobStatus.processedRecords} / {jobStatus.totalRecords}
                </Text>
              </View>
            )}

            {!jobId && (
              <TouchableOpacity
                style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                onPress={handleUpload}
                disabled={uploading || parsedData.length === 0}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Upload color="#fff" size={20} />
                    <Text style={styles.submitButtonText}>Import {parsedData.length} Members</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setFile(null);
                setParsedData([]);
                setJobId(null);
                setJobStatus(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
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
    paddingBottom: 40,
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
    marginTop: 8,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#667eea',
    marginBottom: 16,
  },
  templateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    fontFamily: 'monospace',
  },
  fileCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  fileSize: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});
