import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { School, Users } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import CountryDropdown from '@/components/ui/CountryDropdown';
import { getCurrencySymbol } from '@/lib/utils/get-currency-symbol';
import { countries } from '@/lib/utils/country';
import type { AssociationType } from '@/types';

const CURRENCIES = ['USD', 'GBP', 'EUR', 'NGN', 'ZAR', 'KES', 'GHS', 'INR', 'CNY', 'JPY', 'BRL', 'MXN', 'ARS', 'CAD', 'AUD'];

export default function CreateAssociationPage() {
  const router = useRouter();
  const { createAssociation, isCreating } = useAssociation();
  const { user } = useAuth();
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [type, setType] = useState<AssociationType | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('USD');
  
  // School-specific fields
  const [establishedYear, setEstablishedYear] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [studentCapacity, setStudentCapacity] = useState('');
  const [schoolType, setSchoolType] = useState<'public' | 'private' | 'charter'>('public');
  
  // Community-specific fields
  const [foundedYear, setFoundedYear] = useState('');
  const [location, setLocation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [membershipFee, setMembershipFee] = useState('');
  const [meetingSchedule, setMeetingSchedule] = useState('');
  const [communityWebsite, setCommunityWebsite] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [organizationType, setOrganizationType] = useState<'nonprofit' | 'religious' | 'social' | 'professional'>('nonprofit');

  const handleSelectType = (selectedType: AssociationType) => {
    setType(selectedType);
    setStep('details');
  };

  const handleCountrySelect = (selectedCountry: string) => {
    setCountry(selectedCountry);
    const selectedCountryData = countries.find(c => c.name === selectedCountry);
    if (selectedCountryData) {
      setCurrency(selectedCountryData.currency);
    }
  };

  const handleCreate = () => {
    if (!type || !name || !user) return;

    // Validate required fields
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Association name is required');
      return;
    }
    if (!country) {
      Alert.alert('Validation Error', 'Country is required');
      return;
    }

    // Validate year fields
    const currentYear = new Date().getFullYear();
    if (type === 'school' && establishedYear) {
      const year = parseInt(establishedYear);
      if (isNaN(year) || year < 1000 || year > currentYear) {
        Alert.alert('Validation Error', `Established year must be between 1000 and ${currentYear}`);
        return;
      }
    }
    if (type === 'other' && foundedYear) {
      const year = parseInt(foundedYear);
      if (isNaN(year) || year < 1000 || year > currentYear) {
        Alert.alert('Validation Error', `Founded year must be between 1000 and ${currentYear}`);
        return;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (type === 'school' && email && !emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Invalid email format');
      return;
    }
    if (type === 'other' && contactEmail && !emailRegex.test(contactEmail)) {
      Alert.alert('Validation Error', 'Invalid email format');
      return;
    }

    // Validate website URL
    const urlRegex = /^https?:\/\/.+/;
    if (website && !urlRegex.test(website)) {
      Alert.alert('Validation Error', 'Website must start with http:// or https://');
      return;
    }
    if (communityWebsite && !urlRegex.test(communityWebsite)) {
      Alert.alert('Validation Error', 'Website must start with http:// or https://');
      return;
    }

    const baseData = {
      name,
      type: type === 'other' ? 'community' : type,
      description: description || undefined,
      city: city || undefined,
      country: country || undefined,
      currency: currency || 'USD',
    };

    const schoolInfo = type === 'school' ? {
      establishedYear: establishedYear ? parseInt(establishedYear) : undefined,
      address: address || undefined,
      phoneNumber: phoneNumber || undefined,
      email: email || undefined,
      website: website || undefined,
      studentCapacity: studentCapacity ? parseInt(studentCapacity) : undefined,
      schoolType,
    } : undefined;

    const communityInfo = type === 'other' ? {
      foundedYear: foundedYear ? parseInt(foundedYear) : undefined,
      location: location || undefined,
      contactPhone: contactPhone || undefined,
      contactEmail: contactEmail || undefined,
      membershipFee: membershipFee ? parseFloat(membershipFee) : undefined,
      meetingSchedule: meetingSchedule || undefined,
      website: communityWebsite || undefined,
      maxMembers: maxMembers ? parseInt(maxMembers) : undefined,
      focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
      organizationType,
    } : undefined;

    createAssociation({
      ...baseData,
      ...(schoolInfo && { schoolInfo }),
      ...(communityInfo && { communityInfo }),
    }, {
      onSuccess: () => {
        router.replace('/(auth-tabs)/home');
      },
    });
  };

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Create Association',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
            <Text style={{ color: '#667eea', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        )
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {step === 'type' && (
          <View style={styles.section}>
            <Text style={styles.title}>What type of association?</Text>
            <Text style={styles.description}>
              Choose the category that best describes your group
            </Text>

            <TouchableOpacity
              style={styles.typeCard}
              onPress={() => handleSelectType('school')}
            >
              <School color="#667eea" size={32} />
              <View style={styles.typeContent}>
                <Text style={styles.typeTitle}>School/Alumni</Text>
                <Text style={styles.typeDescription}>
                  For schools, universities, and alumni groups
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.typeCard}
              onPress={() => handleSelectType('other')}
            >
              <Users color="#667eea" size={32} />
              <View style={styles.typeContent}>
                <Text style={styles.typeTitle}>Community/Organization</Text>
                <Text style={styles.typeDescription}>
                  For professional groups, social clubs, and other organizations
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {step === 'details' && type === 'school' && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => setStep('type')} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>School Association Details</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Association Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Harvard Alumni Association"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Established Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1636"
                  value={establishedYear}
                  onChangeText={setEstablishedYear}
                  keyboardType="number-pad"
                />
              </View>



              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cambridge, MA, USA"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1-617-495-1000"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="info@harvard.edu"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Website</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://harvard.edu"
                  value={website}
                  onChangeText={setWebsite}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Student Capacity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5000"
                  value={studentCapacity}
                  onChangeText={setStudentCapacity}
                  keyboardType="number-pad"
                />
              </View>



              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cambridge"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Country</Text>
                <CountryDropdown
                  value={country}
                  onSelect={handleCountrySelect}
                  placeholder="Select country"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Currency</Text>
                <View style={styles.typeButtons}>
                  {CURRENCIES.map(curr => (
                    <TouchableOpacity
                      key={curr}
                      style={[styles.typeButton, currency === curr && styles.typeButtonActive]}
                      onPress={() => setCurrency(curr)}
                    >
                      <Text style={[styles.typeButtonText, currency === curr && styles.typeButtonTextActive]}>
                        {curr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>School Type</Text>
                <View style={styles.typeButtons}>
                  {(['public', 'private', 'charter'] as const).map(sType => (
                    <TouchableOpacity
                      key={sType}
                      style={[styles.typeButton, schoolType === sType && styles.typeButtonActive]}
                      onPress={() => setSchoolType(sType)}
                    >
                      <Text style={[styles.typeButtonText, schoolType === sType && styles.typeButtonTextActive]}>
                        {sType.charAt(0).toUpperCase() + sType.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell members about your association..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isCreating && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={isCreating || !name}
              >
                <Text style={styles.buttonText}>
                  {isCreating ? 'Creating...' : 'Create Association'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'details' && type === 'other' && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => setStep('type')} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Community Association Details</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Association Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Lagos Business Network"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Founded Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2020"
                  value={foundedYear}
                  onChangeText={setFoundedYear}
                  keyboardType="number-pad"
                />
              </View>



              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Lagos, Nigeria"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+234-xxx-xxx-xxxx"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="info@lagosnetwork.org"
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Website</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://lagosnetwork.org"
                  value={communityWebsite}
                  onChangeText={setCommunityWebsite}
                />
              </View>



              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Lagos"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Country</Text>
                <CountryDropdown
                  value={country}
                  onSelect={handleCountrySelect}
                  placeholder="Select country"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Membership Fee</Text>
                <TextInput
                  style={styles.input}
                  placeholder="50000"
                  value={membershipFee}
                  onChangeText={setMembershipFee}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Meeting Schedule</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Every first Sunday of the month"
                  value={meetingSchedule}
                  onChangeText={setMeetingSchedule}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Max Members</Text>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  value={maxMembers}
                  onChangeText={setMaxMembers}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Currency</Text>
                <View style={styles.typeButtons}>
                  {CURRENCIES.map(curr => (
                    <TouchableOpacity
                      key={curr}
                      style={[styles.typeButton, currency === curr && styles.typeButtonActive]}
                      onPress={() => setCurrency(curr)}
                    >
                      <Text style={[styles.typeButtonText, currency === curr && styles.typeButtonTextActive]}>
                        {curr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Organization Type</Text>
                <View style={styles.typeButtons}>
                  {(['nonprofit', 'religious', 'social', 'professional'] as const).map(oType => (
                    <TouchableOpacity
                      key={oType}
                      style={[styles.typeButton, organizationType === oType && styles.typeButtonActive]}
                      onPress={() => setOrganizationType(oType)}
                    >
                      <Text style={[styles.typeButtonText, organizationType === oType && styles.typeButtonTextActive]}>
                        {oType.charAt(0).toUpperCase() + oType.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Focus Areas (Optional)</Text>
                <View style={styles.typeButtons}>
                  {['education', 'health', 'environment', 'business', 'technology', 'arts', 'sports', 'charity'].map(area => (
                    <TouchableOpacity
                      key={area}
                      style={[styles.typeButton, focusAreas.includes(area) && styles.typeButtonActive]}
                      onPress={() => {
                        if (focusAreas.includes(area)) {
                          setFocusAreas(focusAreas.filter(f => f !== area));
                        } else {
                          setFocusAreas([...focusAreas, area]);
                        }
                      }}
                    >
                      <Text style={[styles.typeButtonText, focusAreas.includes(area) && styles.typeButtonTextActive]}>
                        {area.charAt(0).toUpperCase() + area.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell members about your association..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isCreating && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={isCreating || !name}
              >
                <Text style={styles.buttonText}>
                  {isCreating ? 'Creating...' : 'Create Association'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  section: {
    gap: 20,
  },
  backLink: {
    marginBottom: 8,
  },
  backLinkText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#1a1a1a',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  typeCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  typeContent: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 6,
  },
  typeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600' as const,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
});
