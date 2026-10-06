import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, School, Users } from 'lucide-react-native';
import { Stack } from 'expo-router';
import type { AssociationType, Association } from '@/types';
import { useAssociation } from '@/contexts/AssociationContext';
import { apiService } from '@/services/api';
import CountryDropdown from '@/components/ui/CountryDropdown';

export default function JoinPage() {
  const router = useRouter();
  const { joinAssociation, isJoining, searchAssociations, searchResults } = useAssociation();
  
  const [step, setStep] = useState<'type' | 'method' | 'code' | 'country' | 'found' | 'notfound'>('type');
  const [selectedType, setSelectedType] = useState<AssociationType | null>(null);
  const [associationCode, setAssociationCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [foundAssociation, setFoundAssociation] = useState<Association | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchByCode = async () => {
    if (!associationCode.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await apiService.searchAssociationByCode(associationCode.trim().toUpperCase());
      console.log('Search response:', response);
      
      // Handle different response structures
      const associations = response?.data?.associations || response?.associations || response?.data || response;
      const result = Array.isArray(associations) ? associations[0] : associations;
      
      if (result && result.name) {
        // Validate association type matches selected type
        const expectedType = selectedType === 'other' ? 'community' : selectedType;
        const actualType = result.type === 'community' ? 'community' : result.type;
        
        if (expectedType && actualType !== expectedType) {
          setStep('notfound');
          return;
        }
        
        setFoundAssociation(result);
        setStep('found');
      } else {
        setStep('notfound');
      }
    } catch (error: any) {
      console.error('Search by code error:', error);
      setStep('notfound');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectType = (type: AssociationType) => {
    setSelectedType(type);
    setStep('method');
  };

  const handleSelectCountry = async (countryName: string) => {
    setSelectedCountry(countryName);
    
    setIsSearching(true);
    searchAssociations({ 
      query: countryName, 
      type: selectedType === 'other' ? 'community' : selectedType || undefined 
    }, {
      onSuccess: () => {
        setIsSearching(false);
      },
      onError: (error) => {
        console.error('Error searching associations:', error);
        setIsSearching(false);
      }
    });
  };

  const handleSelectAssociation = (association: Association) => {
    Alert.alert(
      'Join Association',
      `Do you want to join ${association.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join', 
          onPress: () => handleJoinAssociation(association.code)
        }
      ]
    );
  };

  const handleJoinAssociation = (code: string) => {
    joinAssociation({ code }, {
      onSuccess: () => {
        Alert.alert(
          'Success!', 
          'You have successfully joined the association.',
          [{ 
            text: 'OK', 
            onPress: () => router.replace('/(auth-tabs)/home')
          }]
        );
      },
      onError: (error: any) => {
        Alert.alert(
          'Error', 
          error?.message || 'Failed to join association. Please try again.'
        );
      }
    });
  };

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Join Association',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
            <Text style={{ color: '#667eea', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
        )
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {step === 'type' && (
          <View style={styles.section}>
            <Text style={styles.title}>What type of association are you looking for?</Text>
            <Text style={styles.description}>
              Choose the category that matches your association
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

        {step === 'method' && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => setStep('type')} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>How would you like to find your association?</Text>

            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => setStep('code')}
            >
              <Search color="#667eea" size={24} />
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>I have an association code</Text>
                <Text style={styles.optionDescription}>Enter your unique code to join directly</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => setStep('country')}
            >
              <MapPin color="#667eea" size={24} />
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Search by location</Text>
                <Text style={styles.optionDescription}>Find associations in your country</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.createSection}>
              <Text style={styles.createText}>Can't find what you're looking for?</Text>
              <TouchableOpacity onPress={() => router.push('/create-association')}>
                <Text style={styles.createLink}>Create your own association</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'code' && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => setStep('method')} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Enter Association Code</Text>
            <Text style={styles.description}>
              Enter the unique code provided by your association administrator
            </Text>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="e.g. HAR2020"
                placeholderTextColor="#999"
                value={associationCode}
                onChangeText={setAssociationCode}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, isSearching && styles.buttonDisabled]} 
              onPress={handleSearchByCode}
              disabled={isSearching}
            >
              <Text style={styles.buttonText}>
                {isSearching ? 'Searching...' : 'Search Association'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'found' && foundAssociation && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => {
              setAssociationCode('');
              setStep('code');
            }} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Association Found</Text>
            <Text style={styles.description}>
              We found this association matching your code
            </Text>

            <View style={styles.associationCard}>
              <Text style={styles.associationName}>{foundAssociation.name}</Text>
              <Text style={styles.associationCode}>Code: {foundAssociation.code}</Text>
              <Text style={styles.associationType}>
                {foundAssociation.type === 'school' ? 'School/Alumni' : 'Community'}
              </Text>
              {foundAssociation.description && (
                <Text style={styles.associationDescription}>{foundAssociation.description}</Text>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.button, isJoining && styles.buttonDisabled]} 
              onPress={() => handleJoinAssociation(foundAssociation.code)}
              disabled={isJoining}
            >
              <Text style={styles.buttonText}>
                {isJoining ? 'Joining...' : 'Join Association'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'notfound' && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => {
              setAssociationCode('');
              setStep('code');
            }} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.notFoundContainer}>
              <View style={styles.notFoundIcon}>
                <Search color="#ccc" size={48} />
              </View>
              <Text style={styles.notFoundTitle}>Association Not Found</Text>
              <Text style={styles.notFoundMessage}>
                We couldn't find any association with the code "{associationCode.toUpperCase()}"
              </Text>
              <Text style={styles.notFoundSubMessage}>
                Please double-check the code or contact your association administrator
              </Text>
            </View>

            <View style={styles.notFoundActions}>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => {
                  setAssociationCode('');
                  setStep('code');
                }}
              >
                <Text style={styles.secondaryButtonText}>Try Another Code</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.button}
                onPress={() => router.push('/create-association')}
              >
                <Text style={styles.buttonText}>Create New Association</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'country' && !selectedCountry && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => setStep('method')} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Select Your Country</Text>
            <Text style={styles.description}>
              Choose the country where your association is located
            </Text>

            <CountryDropdown
              value={selectedCountry}
              onSelect={handleSelectCountry}
              placeholder="Select a country"
            />

            <View style={styles.createSection}>
              <Text style={styles.createText}>Couldn't find your country in the list?</Text>
              <TouchableOpacity onPress={() => router.push('/create-association')}>
                <Text style={styles.createLink}>Create your association</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'country' && selectedCountry && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => setSelectedCountry('')} style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back to countries</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Associations in {selectedCountry}</Text>
            <Text style={styles.description}>
              Select the association you want to join
            </Text>

            <View style={styles.associationList}>
              {isSearching ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Searching associations...</Text>
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map(assoc => (
                  <TouchableOpacity
                    key={assoc.id}
                    style={styles.associationCard}
                    onPress={() => handleSelectAssociation(assoc)}
                  >
                    <Text style={styles.associationName}>{assoc.name}</Text>
                    <Text style={styles.associationCode}>Code: {assoc.code}</Text>
                    <Text style={styles.associationType}>
                      {assoc.type === 'school' ? 'School/Alumni' : 'Community'}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No associations found in {selectedCountry}</Text>
                  <TouchableOpacity onPress={() => router.push('/create-association')}>
                    <Text style={styles.createLink}>Create the first one</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  optionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  inputGroup: {
    gap: 8,
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
  button: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  createSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  createText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  createLink: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '700' as const,
  },

  associationList: {
    gap: 16,
  },
  associationCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  associationName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  associationCode: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 4,
  },
  associationType: {
    fontSize: 14,
    color: '#666',
  },
  associationDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  notFoundContainer: {
    alignItems: 'center',
    padding: 40,
  },
  notFoundIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  notFoundTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  notFoundMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  notFoundSubMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  notFoundActions: {
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 17,
    fontWeight: '600' as const,
  },
});