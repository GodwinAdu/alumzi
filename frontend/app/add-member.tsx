import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { UserPlus, Share2, Phone, Users, Check, X } from "lucide-react-native";
import { useAssociation } from "@/contexts/AssociationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import * as Contacts from "expo-contacts";
import { api } from "@/lib/api";

export default function AddMemberPage() {
  const router = useRouter();
  const { userAssociations, addMember, isAddingMember } = useAssociation();
  const selectedAssociation = userAssociations?.[0]; // Use first association for now
  const { user } = useAuth();
  const { subscription, limits, canAddMembers } = useSubscription();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"member" | "moderator">("member");
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(
    new Set()
  );
  const [contactsWithStatus, setContactsWithStatus] = useState<any[]>([]);
  const [manualMembers, setManualMembers] = useState<
    Array<{ name: string; email: string; phoneNumber: string; role: string }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!selectedAssociation) return;

    const message = `Join ${selectedAssociation.name}!\n\nUse code: ${selectedAssociation.code}\n\nDownload the app and join our association.`;

    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(
          `Code: ${selectedAssociation.code}`
        );
        alert("Association code copied to clipboard!");
      } else {
        await Share.share({
          message,
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      
      // Request full contact permissions
      const { status } = await Contacts.requestPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status === 'granted') {
        console.log('Permission granted, loading contacts...');
        
        // Try multiple loading strategies
        let allContacts: any[] = [];
        
        // Strategy 1: Load with all available fields
        try {
          console.log('Trying comprehensive field loading...');
          const result = await Contacts.getContactsAsync({
            fields: [
              Contacts.Fields.ID,
              Contacts.Fields.Name,
              Contacts.Fields.FirstName,
              Contacts.Fields.LastName,
              Contacts.Fields.PhoneNumbers,
              Contacts.Fields.Emails,
              Contacts.Fields.ContactType,
            ],
          });
          allContacts = result.data;
          console.log(`Comprehensive load: ${allContacts.length} contacts`);
        } catch (comprehensiveError) {
          console.log('Comprehensive load failed:', comprehensiveError instanceof Error ? comprehensiveError.message : 'Unknown error');
          
          // Strategy 2: Basic fields only
          try {
            console.log('Trying basic field loading...');
            const result = await Contacts.getContactsAsync({
              fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
            });
            allContacts = result.data;
            console.log(`Basic load: ${allContacts.length} contacts`);
          } catch (basicError) {
            console.log('Basic load failed, trying pagination...');
            
            // Fallback to pagination
            let hasNextPage = true;
            let pageOffset = 0;
            
            while (hasNextPage && pageOffset < 50000) { // Safety limit
              const result = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
                sort: Contacts.SortTypes.FirstName,
                pageSize: 1000,
                pageOffset,
              });
              
              console.log(`Batch ${Math.floor(pageOffset/1000) + 1}: ${result.data.length} contacts`);
              allContacts.push(...result.data);
              pageOffset += result.data.length;
              hasNextPage = result.hasNextPage && result.data.length > 0;
              
              if (result.data.length === 0) break;
            }
          }
        }

        console.log('=== CONTACT LOADING SUMMARY ===');
        console.log('Total raw contacts loaded:', allContacts.length);
        
        // Debug: Check contact sources
        const contactSources: { [key: string]: number } = {};
        allContacts.forEach(contact => {
          const source = contact.contactType || 'unknown';
          contactSources[source] = (contactSources[source] || 0) + 1;
        });
        console.log('Contact sources:', contactSources);
        
        const filteredContacts = allContacts.filter(
          (contact) => contact.name && contact.phoneNumbers?.length > 0
        );
        setContacts(filteredContacts);
        console.log('Contacts with names and phone numbers:', filteredContacts.length);
        console.log('=== END SUMMARY ===');
        
      
        if (selectedAssociation && filteredContacts.length > 0) {
          setTimeout(() => {
            checkExistingMembers(filteredContacts);
          }, 300);
        }
      } else {
        Alert.alert('Permission Required', 'Please allow access to contacts.');
      }
    } catch (error) {
      console.error('Load contacts error:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingMembers = async (contactList: any[]) => {
    try {
      const contactData = contactList
        .map((contact) => ({
          phoneNumber:
            contact.phoneNumbers?.[0]?.number
              ?.replace(/\s+/g, "")
              .substring(0, 20) || "",
        }))
        .filter(
          (contact) => contact.phoneNumber
        );

      const { contacts: statusContacts } = await api.checkExistingMembers(
        selectedAssociation?.id || "",
        contactData
      );
      
      console.log('API returned status for', statusContacts.length, 'contacts');
      console.log('First few status contacts:', statusContacts.slice(0, 3));
      
      // Merge status with full contact list using only phone number
      const contactsWithMergedStatus = contacts.map(contact => {
        const contactPhone = contact.phoneNumbers?.[0]?.number?.replace(/\s+/g, "").substring(0, 20);
        const statusContact = statusContacts.find(sc => 
          sc.phoneNumber === contactPhone
        );
        
        if (statusContact) {
          console.log(`Matched contact: ${contact.name} (${contactPhone}) - isExisting: ${statusContact.isExisting}`);
          return {
            ...contact,
            isExisting: statusContact.isExisting
          };
        }
        return contact;
      });
      
      setContactsWithStatus(contactsWithMergedStatus);
      console.log(`Merged status for ${contactsWithMergedStatus.length} contacts`);
    } catch (error) {
      console.error("Error checking existing members:", error);
    }
  };



  const getFilteredContacts = () => {
    const contactsToFilter = contactsWithStatus.length > 0 ? contactsWithStatus : contacts;
    console.log(`Displaying contacts: ${contactsToFilter.length} total, search: "${searchQuery}"`);
    
    if (!searchQuery) {
      console.log(`Showing all ${contactsToFilter.length} contacts`);
      return contactsToFilter;
    }
    
    const filtered = contactsToFilter.filter(
      (contact) =>
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phoneNumbers?.[0]?.number?.includes(searchQuery) ||
        contact.phoneNumber?.includes(searchQuery)
    );
    console.log(`Search "${searchQuery}" returned ${filtered.length} contacts`);
    return filtered;
  };

  const handleToggleContact = (contact: any, index: number) => {
    // Don't allow selection of existing members or unregistered users
    if (contact.isExisting || !contact.isRegistered) {
      console.log('Attempted to select invalid contact:', contact.name, 'isExisting:', contact.isExisting, 'isRegistered:', contact.isRegistered);
      return;
    }
    
    const contactKey = `${contact.name}-${index}`;
    const newSelected = new Set(selectedContacts);

    if (newSelected.has(contactKey)) {
      newSelected.delete(contactKey);
    } else {
      newSelected.add(contactKey);
    }

    setSelectedContacts(newSelected);
  };

  const addManualMember = () => {
    if (name && (email || phoneNumber)) {
      setManualMembers([...manualMembers, { name, email, phoneNumber, role }]);
      setName("");
      setEmail("");
      setPhoneNumber("");
      setRole("member");
    }
  };

  const removeManualMember = (index: number) => {
    setManualMembers(manualMembers.filter((_, i) => i !== index));
  };

  const handleAddMembers = async () => {
    if (!selectedAssociation) return;

    const membersToAdd = [];
    const guestMembersToAdd = [];

    // Add selected contacts (registered users only)
    selectedContacts.forEach((contactKey) => {
      const [contactName, indexStr] = contactKey.split("-");
      const index = parseInt(indexStr);
      const contact = contactsWithStatus[index] || contacts[index];

      if (contact && !contact.isExisting && contact.isRegistered) {
        membersToAdd.push({
          name: contact.name,
          email: contact.emails?.[0]?.email || contact.email || "",
          phoneNumber:
            contact.phoneNumbers?.[0]?.number || contact.phoneNumber || "",
          role: "member",
        });
      }
    });

    // Add manual members as guest members (non-app users)
    guestMembersToAdd.push(...manualMembers);

    if (membersToAdd.length === 0 && guestMembersToAdd.length === 0) {
      Alert.alert("No Members", "Please select contacts or add guest members");
      return;
    }

    // Check subscription limits
    const currentCount = subscription?.currentMembers || 0;
    const newTotal = currentCount + membersToAdd.length + guestMembersToAdd.length;
    
    if (!canAddMembers || (limits.memberLimit !== -1 && newTotal > limits.memberLimit)) {
      Alert.alert(
        'Member Limit Exceeded',
        `Your ${subscription?.plan || 'free'} plan allows ${limits.memberLimit} members. You currently have ${currentCount} members. Upgrade your plan to add more members.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade Plan', 
            onPress: () => router.push('/subscription-settings')
          }
        ]
      );
      return;
    }

    try {
      console.log("Sending members to add:", { membersToAdd, guestMembersToAdd });
      console.log("Association ID:", selectedAssociation.id);

      const { results } = await api.addMembers(
        selectedAssociation.id,
        membersToAdd,
        guestMembersToAdd
      );

      console.log("Add members results:", results);

      const added = results.filter((r: any) => r.status === "added").length;
      const existing = results.filter((r: any) => r.status === "exists").length;
      const errors = results.filter((r: any) => r.status === "error").length;
      const guests = results.filter((r: any) => r.isGuest).length;

      let message = `${added} members added successfully`;
      if (guests > 0) message += ` (${guests} as guest members)`;
      if (existing > 0) message += `, ${existing} already members`;
      if (errors > 0) message += `, ${errors} failed`;

      Alert.alert("Members Added", message);
      setSelectedContacts(new Set());
      setManualMembers([]);
      setContactsWithStatus([]);
      router.back();
    } catch (error) {
      console.error("Add members error:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to add members"
      );
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Add Member" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* <View style={styles.shareSection}>
          <View style={styles.shareSectionHeader}>
            <Share2 color="#667eea" size={24} />
            <Text style={styles.shareSectionTitle}>Share Invitation</Text>
          </View>
          <Text style={styles.shareSectionDescription}>
            Share your association code with friends to invite them
          </Text>
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Association Code</Text>
            <Text style={styles.codeText}>{selectedAssociation?.code}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Share2 color="#fff" size={20} />
            <Text style={styles.shareButtonText}>Share Code</Text>
          </TouchableOpacity>
        </View> */}
        <View style={styles.formSection}>
          <View style={styles.formHeader}>
            <UserPlus color="#667eea" size={24} />
            <Text style={styles.formTitle}>Add Member Directly</Text>
          </View>

          <TouchableOpacity
            style={styles.contactsButton}
            onPress={() => {
              setShowContacts(!showContacts);
              if (!showContacts && contacts.length === 0) {
                loadContacts();
              }
            }}
          >
            <Phone color="#667eea" size={20} />
            <Text style={styles.contactsButtonText}>
              {loading ? 'Loading Contacts...' : 'Select from Contacts'}
            </Text>
          </TouchableOpacity>

          {showContacts && (
            <>
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              <Text style={styles.contactCount}>
                Showing {getFilteredContacts().length} of {contacts.length} contacts
              </Text>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading all contacts...</Text>
                </View>
              ) : (
                <ScrollView 
                  style={styles.contactsList} 
                  nestedScrollEnabled
                >
                {getFilteredContacts().map((contact, index) => {
                    const contactKey = `${contact.name}-${index}`;
                    const isSelected = selectedContacts.has(contactKey);
                    const isExisting = Boolean(contact.isExisting);
                    const isRegistered = Boolean(contact.isRegistered);
                    const isDisabled = isExisting || !isRegistered;
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.contactItem,
                          isDisabled && styles.contactItemDisabled,
                        ]}
                        onPress={() =>
                          !isDisabled && handleToggleContact(contact, index)
                        }
                        disabled={isDisabled}
                      >
                        <View style={styles.contactAvatar}>
                          <Text style={styles.contactAvatarText}>
                            {contact.name?.charAt(0)?.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.contactInfo}>
                          <Text
                            style={[
                              styles.contactName,
                              isDisabled && styles.contactNameDisabled,
                            ]}
                          >
                            {contact.name}
                          </Text>
                          <Text
                            style={[
                              styles.contactDetails,
                              isDisabled && styles.contactDetailsDisabled,
                            ]}
                          >
                            {contact.phoneNumbers?.[0]?.number ||
                              contact.phoneNumber}
                          </Text>
                          {isExisting && (
                            <Text style={styles.existingLabel}>
                              Already member
                            </Text>
                          )}
                          {!isExisting && !isRegistered && (
                            <Text style={styles.notRegisteredLabel}>
                              Not registered
                            </Text>
                          )}
                        </View>
                        <View style={styles.contactAction}>
                          {isDisabled ? (
                            <X color="#999" size={20} />
                          ) : isSelected ? (
                            <Check color="#667eea" size={20} />
                          ) : (
                            <View style={styles.uncheckedCircle} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </>
          )}

          {selectedContacts.size > 0 && (
            <View style={styles.selectedCount}>
              <Text style={styles.selectedCountText}>
                {selectedContacts.size} contact
                {selectedContacts.size !== 1 ? "s" : ""} selected
              </Text>
            </View>
          )}

          {manualMembers.length > 0 && (
            <View style={styles.manualMembersList}>
              <Text style={styles.manualMembersTitle}>Manual Members:</Text>
              {manualMembers.map((member, index) => (
                <View key={index} style={styles.manualMemberItem}>
                  <View style={styles.manualMemberInfo}>
                    <Text style={styles.manualMemberName}>{member.name}</Text>
                    <Text style={styles.manualMemberDetails}>
                      {member.phoneNumber || member.email}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeManualMember(index)}>
                    <X color="#ff4757" size={20} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Add Guest Member (Non-App Users)</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1234567890"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Member Role</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === "member" && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole("member")}
                >
                  <Text
                    style={[
                      styles.roleText,
                      role === "member" && styles.roleTextActive,
                    ]}
                  >
                    Member
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === "moderator" && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole("moderator")}
                >
                  <Text
                    style={[
                      styles.roleText,
                      role === "moderator" && styles.roleTextActive,
                    ]}
                  >
                    Moderator
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.helperText}>
              * At least email or phone number is required. Guest members won't have app access but can be tracked for sales/contributions.
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                (!name || (!email && !phoneNumber)) && styles.buttonDisabled,
              ]}
              onPress={addManualMember}
              disabled={!name || (!email && !phoneNumber)}
            >
              <Text style={styles.buttonText}>Add to List</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                selectedContacts.size === 0 &&
                  manualMembers.length === 0 &&
                  styles.buttonDisabled,
              ]}
              onPress={handleAddMembers}
              disabled={
                selectedContacts.size === 0 && manualMembers.length === 0
              }
            >
              <Text style={styles.buttonText}>
                Add {selectedContacts.size + manualMembers.length} Member
                {selectedContacts.size + manualMembers.length !== 1 ? "s" : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  shareSection: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  shareSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  shareSectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1a1a1a",
  },
  shareSectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  codeCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  codeText: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#667eea",
    letterSpacing: 2,
  },
  shareButton: {
    flexDirection: "row",
    backgroundColor: "#667eea",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "600" as const,
  },
  formSection: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1a1a1a",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#1a1a1a",
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  roleButtons: {
    flexDirection: "row",
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: "#e0e7ff",
    borderColor: "#667eea",
  },
  roleText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#666",
  },
  roleTextActive: {
    color: "#667eea",
  },
  helperText: {
    fontSize: 13,
    color: "#999",
    marginTop: -8,
  },
  button: {
    backgroundColor: "#667eea",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700" as const,
  },
  contactsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0f4ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#667eea",
    marginBottom: 16,
  },
  contactsButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#667eea",
  },
  contactsList: {
    height: 300,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 16,
    paddingVertical: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  contactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  contactInfo: {
    flex: 1,
    marginRight: 12,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#1a1a1a",
    marginBottom: 2,
  },
  contactDetails: {
    fontSize: 12,
    color: "#666",
  },
  contactItemDisabled: {
    opacity: 0.5,
  },
  contactNameDisabled: {
    color: "#999",
  },
  contactDetailsDisabled: {
    color: "#ccc",
  },
  existingLabel: {
    fontSize: 10,
    color: "#ff4757",
    fontWeight: "600" as const,
    marginTop: 2,
  },
  notRegisteredLabel: {
    fontSize: 10,
    color: "#f59e0b",
    fontWeight: "600" as const,
    marginTop: 2,
  },
  contactAction: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  uncheckedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  selectedCount: {
    backgroundColor: "#e0e7ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedCountText: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600" as const,
    textAlign: "center",
  },
  manualMembersList: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  manualMembersTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#1a1a1a",
    marginBottom: 12,
  },
  manualMemberItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  manualMemberInfo: {
    flex: 1,
  },
  manualMemberName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#1a1a1a",
    marginBottom: 2,
  },
  manualMemberDetails: {
    fontSize: 12,
    color: "#666",
  },
  primaryButton: {
    backgroundColor: "#10b981",
  },
  searchInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 8,
  },
  loadingContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  contactCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
});
