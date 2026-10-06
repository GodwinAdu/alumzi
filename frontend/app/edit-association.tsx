import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ArrowLeft, Save, School, Users, MapPin, Globe, Calendar, DollarSign } from 'lucide-react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAssociation } from '@/contexts/AssociationContext';
import CountryDropdown from '@/components/ui/CountryDropdown';
import { countries } from '@/lib/utils/country';


export default function EditAssociationPage() {
  const { selectedAssociation } = useAssociation();
  const { updateAssociation, isUpdatingAssociation } = useAssociation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'school',
    city: '',
    country: '',
    currency: 'USD',
    // School specific fields
    schoolInfo: {
      establishedYear: '',
      address: '',
      phoneNumber: '',
      email: '',
      website: '',
      studentCapacity: '',
      schoolType: 'public'
    },
    // Community specific fields
    communityInfo: {
      foundedYear: '',
      location: '',
      contactPhone: '',
      contactEmail: '',
      membershipFee: '',
      meetingSchedule: '',
      website: '',
      maxMembers: '',
      focusAreas: [],
      organizationType: 'nonprofit'
    }
  });

  useEffect(() => {
    if (selectedAssociation) {
      const newFormData = {
        name: selectedAssociation.name || '',
        description: selectedAssociation.description || '',
        type: selectedAssociation.type || 'school',
        city: selectedAssociation.city || '',
        country: selectedAssociation.country || '',
        currency: selectedAssociation.currency || 'USD',
        schoolInfo: {
          establishedYear: selectedAssociation.schoolInfo?.establishedYear?.toString() || '',
          address: selectedAssociation.schoolInfo?.address || '',
          phoneNumber: selectedAssociation.schoolInfo?.phoneNumber || '',
          email: selectedAssociation.schoolInfo?.email || '',
          website: selectedAssociation.schoolInfo?.website || '',
          studentCapacity: selectedAssociation.schoolInfo?.studentCapacity?.toString() || '',
          schoolType: selectedAssociation.schoolInfo?.schoolType || 'public'
        },
        communityInfo: {
          foundedYear: selectedAssociation.communityInfo?.foundedYear?.toString() || '',
          location: selectedAssociation.communityInfo?.location || '',
          contactPhone: selectedAssociation.communityInfo?.contactPhone || '',
          contactEmail: selectedAssociation.communityInfo?.contactEmail || '',
          membershipFee: selectedAssociation.communityInfo?.membershipFee?.toString() || '',
          meetingSchedule: selectedAssociation.communityInfo?.meetingSchedule || '',
          website: selectedAssociation.communityInfo?.website || '',
          maxMembers: selectedAssociation.communityInfo?.maxMembers?.toString() || '',
          focusAreas: selectedAssociation.communityInfo?.focusAreas || [],
          organizationType: selectedAssociation.communityInfo?.organizationType || 'nonprofit'
        }
      };
      setFormData(newFormData);
    }
  }, [selectedAssociation]);

  const handleCountrySelect = (selectedCountry: string) => {
    const selectedCountryData = countries.find(c => c.name === selectedCountry);
    setFormData(prev => ({
      ...prev,
      country: selectedCountry,
      currency: selectedCountryData?.currency || prev.currency
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Association name is required');
      return;
    }

    updateAssociation({
      associationId: selectedAssociation?.id || '',
      data: formData
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Association updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      },
      onError: () => {
        Alert.alert('Error', 'Failed to update association');
      }
    });
  };

  const getTypeIcon = (type: string) => {
    return type === 'school' ? <School color="#667eea" size={20} /> : <Users color="#667eea" size={20} />;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <View style={styles.topActions}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#333" size={24} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Edit Association</Text>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={isUpdatingAssociation}
          >
            <Save color="#667eea" size={20} />
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Association Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter association name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter description"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeOptions}>
              {['school', 'community'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    formData.type === type && styles.typeOptionActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type }))}
                >
                  {getTypeIcon(type)}
                  <Text style={[
                    styles.typeOptionText,
                    formData.type === type && styles.typeOptionTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              placeholder="Enter city"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country</Text>
            <CountryDropdown
              value={formData.country}
              onSelect={handleCountrySelect}
              placeholder="Select country"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Currency</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#f5f5f5', color: '#666' }]}
              value={formData.currency}
              placeholder="USD"
              editable={false}
            />
          </View>
        </View>

        {formData.type === 'school' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>School Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Established Year</Text>
              <TextInput
                style={styles.input}
                value={formData.schoolInfo.establishedYear}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  schoolInfo: { ...prev.schoolInfo, establishedYear: text }
                }))}
                placeholder="Enter established year"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={formData.schoolInfo.address}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  schoolInfo: { ...prev.schoolInfo, address: text }
                }))}
                placeholder="Enter school address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.schoolInfo.phoneNumber}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  schoolInfo: { ...prev.schoolInfo, phoneNumber: text }
                }))}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.schoolInfo.email}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  schoolInfo: { ...prev.schoolInfo, email: text }
                }))}
                placeholder="Enter email address"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                value={formData.schoolInfo.website}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  schoolInfo: { ...prev.schoolInfo, website: text }
                }))}
                placeholder="https://school.edu"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Student Capacity</Text>
              <TextInput
                style={styles.input}
                value={formData.schoolInfo.studentCapacity}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  schoolInfo: { ...prev.schoolInfo, studentCapacity: text }
                }))}
                placeholder="Enter student capacity"
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {formData.type === 'community' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Community Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Founded Year</Text>
              <TextInput
                style={styles.input}
                value={formData.communityInfo.foundedYear}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  communityInfo: { ...prev.communityInfo, foundedYear: text }
                }))}
                placeholder="Enter founded year"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.communityInfo.location}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  communityInfo: { ...prev.communityInfo, location: text }
                }))}
                placeholder="Enter location"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.communityInfo.contactPhone}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  communityInfo: { ...prev.communityInfo, contactPhone: text }
                }))}
                placeholder="Enter contact phone"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Email</Text>
              <TextInput
                style={styles.input}
                value={formData.communityInfo.contactEmail}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  communityInfo: { ...prev.communityInfo, contactEmail: text }
                }))}
                placeholder="Enter contact email"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Membership Fee</Text>
              <TextInput
                style={styles.input}
                value={formData.communityInfo.membershipFee}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  communityInfo: { ...prev.communityInfo, membershipFee: text }
                }))}
                placeholder="Enter membership fee"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Meeting Schedule</Text>
              <TextInput
                style={styles.input}
                value={formData.communityInfo.meetingSchedule}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  communityInfo: { ...prev.communityInfo, meetingSchedule: text }
                }))}
                placeholder="Enter meeting schedule"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                value={formData.communityInfo.website}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  communityInfo: { ...prev.communityInfo, website: text }
                }))}
                placeholder="https://community.org"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Max Members</Text>
              <TextInput
                style={styles.input}
                value={formData.communityInfo.maxMembers}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  communityInfo: { ...prev.communityInfo, maxMembers: text }
                }))}
                placeholder="Enter maximum members"
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.primaryButton, isUpdatingAssociation && styles.primaryButtonDisabled]}
          onPress={handleSave}
          disabled={isUpdatingAssociation}
        >
          <Text style={styles.primaryButtonText}>
            {isUpdatingAssociation ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  typeOptionActive: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  typeOptionTextActive: {
    color: '#667eea',
  },
  primaryButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});