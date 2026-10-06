import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Info, DollarSign, Settings, Send, Pin, Plus, Calendar, BarChart3, Megaphone, X, Check, FileText, Image, User, CreditCard } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

export default function GroupChatScreen() {
  const router = useRouter();
  const { groupId, groupName, associationId, isDefault } = useLocalSearchParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showShareContact, setShowShareContact] = useState(false);
  const [contactSource, setContactSource] = useState<'community' | 'device'>('community');
  const [deviceContacts, setDeviceContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  
  const isDefaultGroup = isDefault === 'true';

  const { data: messagesData, refetch } = useQuery({
    queryKey: ['groupMessages', groupId],
    queryFn: () => api.get(`/groups/${groupId}/messages`),
    enabled: !!groupId,
  });

  const { data: announcementsData, refetch: refetchAnnouncements } = useQuery({
    queryKey: ['groupAnnouncements', groupId],
    queryFn: () => api.getGroupAnnouncements(groupId as string),
    enabled: !!groupId,
  });

  const { data: pollsData, refetch: refetchPolls } = useQuery({
    queryKey: ['groupPolls', groupId],
    queryFn: () => api.getGroupPolls(groupId as string),
    enabled: !!groupId,
  });

  const { data: eventsData, refetch: refetchEvents } = useQuery({
    queryKey: ['groupEvents', groupId],
    queryFn: () => api.getGroupEvents(groupId as string),
    enabled: !!groupId,
  });

  const { data: joinRequestsData, isError: joinRequestsError } = useQuery({
    queryKey: ['groupJoinRequests', groupId],
    queryFn: async () => {
      try {
        const data = await api.getGroupJoinRequests(groupId as string);
        console.log('✅ Join requests loaded:', data);
        return data;
      } catch (error: any) {
        console.log('⚠️ Join requests error (probably not admin):', error.message);
        return { requests: [] }; // Return empty array instead of throwing
      }
    },
    enabled: !!groupId,
  });

  const { data: groupSettingsData } = useQuery({
    queryKey: ['groupSettings', groupId],
    queryFn: () => api.getGroupSettings(groupId as string),
    enabled: !!groupId,
  });

  const { data: memberDuesData } = useQuery({
    queryKey: ['memberDues', groupId],
    queryFn: () => api.getMemberDuesStatus(groupId as string),
    enabled: !!groupId && groupSettingsData?.settings?.dues?.enabled,
  });

  const { data: communityMembersData } = useQuery({
    queryKey: ['communityMembers', associationId],
    queryFn: () => api.getAssociationMembers(associationId as string),
    enabled: !!associationId && showShareContact,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => api.post(`/groups/${groupId}/messages`, { text }),
    onSuccess: () => {
      setMessage('');
      refetch();
    },
  });

  const createPollMutation = useMutation({
    mutationFn: (data: any) => api.createPoll(groupId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupPolls', groupId] });
      setShowCreatePoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    },
  });

  const votePollMutation = useMutation({
    mutationFn: ({ pollId, optionIndex }: { pollId: string; optionIndex: number }) => 
      api.votePoll(pollId, optionIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groupPolls', groupId] }),
  });

  const createEventMutation = useMutation({
    mutationFn: (data: any) => api.createEvent(groupId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupEvents', groupId] });
      setShowCreateEvent(false);
      setEventTitle('');
      setEventDescription('');
      setEventLocation('');
      setEventDate('');
    },
  });

  const respondEventMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: 'going' | 'maybe' | 'not_going' }) => 
      api.respondToEvent(eventId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groupEvents', groupId] }),
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: (data: any) => api.createAnnouncement(groupId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupAnnouncements', groupId] });
      setShowCreateAnnouncement(false);
      setAnnouncementTitle('');
      setAnnouncementContent('');
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: (requestId: string) => api.approveJoinRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupJoinRequests', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (requestId: string) => api.rejectJoinRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupJoinRequests', groupId] });
    },
  });

  const messages = messagesData?.messages || [];
  const announcements = announcementsData?.announcements || [];
  const polls = pollsData?.polls || [];
  const events = eventsData?.events || [];
  const joinRequests = (joinRequestsData?.requests || []).filter((r: any) => r); // Filter out null/undefined
  const upcomingEvents = events.filter((e: any) => new Date(e.startDate) > new Date()).slice(0, 3);
  const isDuesEnabled = groupSettingsData?.settings?.dues?.enabled;
  const hasOutstandingDues = memberDuesData?.totalOutstanding > 0;

  console.log('📋 Join Requests:', joinRequests.length, joinRequests);

  useEffect(() => {
    if (!socket || !groupId) return;
    socket.emit('join-group', groupId);
    socket.on('NEW_MESSAGE', () => refetch());
    socket.on('poll_update', () => refetchPolls());
    socket.on('event_update', () => refetchEvents());
    socket.on('announcement_update', () => refetchAnnouncements());
    return () => {
      socket.off('NEW_MESSAGE');
      socket.off('poll_update');
      socket.off('event_update');
      socket.off('announcement_update');
      socket.emit('leave-group', groupId);
    };
  }, [socket, groupId]);

  const handleSend = () => {
    if (message.trim()) {
      sendMutation.mutate(message.trim());
    }
  };

  const handleCreatePoll = () => {
    const validOptions = pollOptions.filter(o => o.trim());
    if (pollQuestion.trim() && validOptions.length >= 2) {
      createPollMutation.mutate({ question: pollQuestion, options: validOptions });
    }
  };

  const handleCreateEvent = () => {
    if (eventTitle.trim() && eventDate) {
      createEventMutation.mutate({
        title: eventTitle,
        description: eventDescription,
        location: eventLocation,
        startDate: eventDate,
      });
    }
  };

  const handleCreateAnnouncement = () => {
    if (announcementTitle.trim() && announcementContent.trim()) {
      createAnnouncementMutation.mutate({
        title: announcementTitle,
        content: announcementContent,
        isPinned: true,
      });
    }
  };

  const handleShareContact = () => {
    if (selectedContact) {
      // Send contact as a special message type with metadata
      const contactData = {
        type: 'contact',
        name: selectedContact.name,
        phoneNumber: selectedContact.phoneNumber || selectedContact.phoneNumbers?.[0]?.number,
        email: selectedContact.email || selectedContact.emails?.[0]?.email,
        userId: selectedContact.userId || selectedContact._id, // If from community
        isRegistered: !!selectedContact.userId || !!selectedContact._id
      };
      
      sendMutation.mutate(JSON.stringify(contactData));
      setShowShareContact(false);
      setSelectedContact(null);
      setContactSource('community');
    }
  };

  const loadDeviceContacts = async () => {
    try {
      const { status } = await require('expo-contacts').requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await require('expo-contacts').getContactsAsync({
          fields: [require('expo-contacts').Fields.PhoneNumbers, require('expo-contacts').Fields.Emails],
        });
        
        // Check which contacts are registered
        const phoneNumbers = data.flatMap((c: any) => c.phoneNumbers?.map((p: any) => p.number) || []);
        const emails = data.flatMap((c: any) => c.emails?.map((e: any) => e.email) || []);
        
        const registeredData = await api.checkRegisteredContacts({ phoneNumbers, emails });
        const registeredMap = new Map();
        registeredData.users.forEach((u: any) => {
          if (u.phoneNumber) registeredMap.set(u.phoneNumber, u);
          if (u.email) registeredMap.set(u.email, u);
        });
        
        // Merge device contacts with registered user data
        const enrichedContacts = data.map((contact: any) => {
          const phone = contact.phoneNumbers?.[0]?.number;
          const email = contact.emails?.[0]?.email;
          const registered = registeredMap.get(phone) || registeredMap.get(email);
          
          return {
            ...contact,
            userId: registered?._id,
            isRegistered: !!registered
          };
        });
        
        setDeviceContacts(enrichedContacts);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const communityMembers = communityMembersData?.members || [];

  const renderPollCard = (poll: any) => {
    const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + opt.votes.length, 0);
    const userVoted = poll.options.some((opt: any) => opt.votes.some((v: any) => v.userId === user?.id));

    return (
      <View key={poll._id} style={styles.pollCard}>
        <View style={styles.pollHeader}>
          <BarChart3 color="#667eea" size={20} />
          <Text style={styles.pollQuestion}>{poll.question}</Text>
        </View>
        {poll.options.map((option: any, index: number) => {
          const percentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
          const isVoted = option.votes.some((v: any) => v.userId === user?.id);
          return (
            <TouchableOpacity
              key={index}
              style={[styles.pollOption, isVoted && styles.pollOptionVoted]}
              onPress={() => votePollMutation.mutate({ pollId: poll._id, optionIndex: index })}
            >
              <View style={[styles.pollBar, { width: `${percentage}%` }]} />
              <View style={styles.pollOptionContent}>
                <Text style={styles.pollOptionText}>{option.text}</Text>
                <Text style={styles.pollVotes}>{option.votes.length} ({percentage.toFixed(0)}%)</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <Text style={styles.pollFooter}>{totalVotes} votes • {userVoted ? 'You voted' : 'Tap to vote'}</Text>
      </View>
    );
  };

  const renderEventCard = (event: any) => {
    const userResponse = event.responses.find((r: any) => r.userId === user?.id);
    const goingCount = event.responses.filter((r: any) => r.status === 'going').length;

    return (
      <View key={event._id} style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <Calendar color="#10b981" size={20} />
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventDate}>{new Date(event.startDate).toLocaleDateString()}</Text>
            {event.location && <Text style={styles.eventLocation}>📍 {event.location}</Text>}
          </View>
        </View>
        {event.description && <Text style={styles.eventDescription}>{event.description}</Text>}
        <View style={styles.eventActions}>
          <TouchableOpacity
            style={[styles.eventButton, userResponse?.status === 'going' && styles.eventButtonActive]}
            onPress={() => respondEventMutation.mutate({ eventId: event._id, status: 'going' })}
          >
            <Text style={[styles.eventButtonText, userResponse?.status === 'going' && styles.eventButtonTextActive]}>
              ✓ Going ({goingCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.eventButton, userResponse?.status === 'maybe' && styles.eventButtonActive]}
            onPress={() => respondEventMutation.mutate({ eventId: event._id, status: 'maybe' })}
          >
            <Text style={[styles.eventButtonText, userResponse?.status === 'maybe' && styles.eventButtonTextActive]}>
              ? Maybe
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMessage = ({ item }: any) => {
    const isOwnMessage = item.senderId === user?.id;
    
    // Check if message is a shared contact
    let contactData = null;
    try {
      const parsed = JSON.parse(item.text);
      if (parsed.type === 'contact') {
        contactData = parsed;
      }
    } catch (e) {
      // Not a contact message
    }
    
    if (contactData) {
      return (
        <View style={[styles.messageRow, isOwnMessage && styles.ownMessageRow]}>
          <View style={[styles.contactMessageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
            {!isOwnMessage && <Text style={styles.senderName}>{item.senderName}</Text>}
            <View style={styles.contactCard}>
              <View style={styles.contactCardAvatar}>
                <Text style={styles.contactCardAvatarText}>{contactData.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.contactCardInfo}>
                <Text style={styles.contactCardName}>{contactData.name}</Text>
                {contactData.phoneNumber && (
                  <Text style={styles.contactCardDetail}>📱 {contactData.phoneNumber}</Text>
                )}
                {contactData.email && (
                  <Text style={styles.contactCardDetail}>✉️ {contactData.email}</Text>
                )}
              </View>
            </View>
            {contactData.isRegistered && (
              <TouchableOpacity 
                style={styles.chatContactButton}
                onPress={() => router.push(`/direct-chat?userId=${contactData.userId}&associationId=${associationId}` as any)}
              >
                <Text style={styles.chatContactButtonText}>💬 Chat</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.messageTime}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={[styles.messageRow, isOwnMessage && styles.ownMessageRow]}>
        <View style={[styles.messageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
          {!isOwnMessage && <Text style={styles.senderName}>{item.senderName}</Text>}
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.messageTime}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{groupName}</Text>
          {upcomingEvents.length > 0 && (
            <Text style={styles.headerSubtitle}>{upcomingEvents.length} upcoming events</Text>
          )}
        </View>

        <TouchableOpacity style={styles.infoButton} onPress={() => setShowCalendar(true)}>
          <Calendar color="#fff" size={24} />
          {upcomingEvents.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{upcomingEvents.length}</Text></View>}
        </TouchableOpacity>

        {isDuesEnabled && (
          <TouchableOpacity 
            style={styles.infoButton} 
            onPress={() => router.push(`/member-dues?groupId=${groupId}&groupName=${groupName}`)}
          >
            <CreditCard color="#fff" size={24} />
            {hasOutstandingDues && <View style={styles.badge}><Text style={styles.badgeText}>!</Text></View>}
          </TouchableOpacity>
        )}

        {!isDefaultGroup && (
          <>
            <TouchableOpacity style={styles.infoButton} onPress={() => router.push(`/group-info?groupId=${groupId}&communityId=${associationId}`)}>
              <Info color="#fff" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoButton} onPress={() => router.push(`/group-financial-dashboard?groupId=${groupId}&groupName=${groupName}`)}>
              <DollarSign color="#fff" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoButton} onPress={() => router.push(`/group-settings?groupId=${groupId}&groupName=${groupName}`)}>
              <Settings color="#fff" size={24} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        {joinRequests.length > 0 && (
          <View style={styles.joinRequestsBanner}>
            <View style={styles.joinRequestsHeader}>
              <Text style={styles.joinRequestsTitle}>Join Requests ({joinRequests.length})</Text>
              <TouchableOpacity onPress={() => router.push(`/group-join-requests?groupId=${groupId}&groupName=${groupName}`)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.joinRequestsList}>
              {joinRequests.slice(0, 3).map((request: any) => (
                <View key={request.id} style={styles.joinRequestCard}>
                  <View style={styles.requestAvatar}>
                    <Text style={styles.requestAvatarText}>{request.name[0]}</Text>
                  </View>
                  <Text style={styles.requestName} numberOfLines={1}>{request.name}</Text>
                  <View style={styles.requestActions}>
                    <TouchableOpacity 
                      style={styles.approveBtn}
                      onPress={() => approveRequestMutation.mutate(request.id)}
                    >
                      <Check color="#fff" size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.rejectBtn}
                      onPress={() => rejectRequestMutation.mutate(request.id)}
                    >
                      <X color="#fff" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {announcements.length > 0 && (
          <View style={styles.announcementsSection}>
            <View style={styles.announcementHeader}>
              <Megaphone color="#f59e0b" size={16} />
              <Text style={styles.announcementHeaderText}>Announcements</Text>
            </View>
            {announcements.slice(0, 2).map((ann: any) => (
              <View key={ann._id} style={styles.announcementCard}>
                <Text style={styles.announcementTitle}>{ann.title}</Text>
                <Text style={styles.announcementContent} numberOfLines={2}>{ann.content}</Text>
              </View>
            ))}
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={[...polls.map((p: any) => ({ type: 'poll', data: p })), ...events.filter((e: any) => new Date(e.startDate) > new Date()).map((e: any) => ({ type: 'event', data: e })), ...messages.map((m: any) => ({ type: 'message', data: m }))]}
          renderItem={({ item }) => {
            if (item.type === 'poll') return renderPollCard(item.data);
            if (item.type === 'event') return renderEventCard(item.data);
            return renderMessage({ item: item.data });
          }}
          keyExtractor={(item, index) => `${item.type}-${item.data._id || item.data.id || index}`}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
        
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.plusButton} onPress={() => setShowToolsMenu(true)}>
            <Plus color="#667eea" size={24} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
          />
          <TouchableOpacity style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]} onPress={handleSend} disabled={!message.trim()}>
            <Send color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showToolsMenu && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowToolsMenu(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowToolsMenu(false)}>
            <View style={styles.toolsMenu}>
              <Text style={styles.toolsTitle}>Create</Text>
              <TouchableOpacity style={styles.toolItem} onPress={() => { setShowToolsMenu(false); setShowCreatePoll(true); }}>
                <BarChart3 color="#667eea" size={24} />
                <Text style={styles.toolText}>Poll</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolItem} onPress={() => { setShowToolsMenu(false); setShowCreateEvent(true); }}>
                <Calendar color="#10b981" size={24} />
                <Text style={styles.toolText}>Event</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolItem} onPress={() => { setShowToolsMenu(false); setShowCreateAnnouncement(true); }}>
                <Megaphone color="#f59e0b" size={24} />
                <Text style={styles.toolText}>Announcement</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolItem} onPress={() => { setShowToolsMenu(false); /* TODO: File picker */ }}>
                <FileText color="#8b5cf6" size={24} />
                <Text style={styles.toolText}>Files</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolItem} onPress={() => { setShowToolsMenu(false); /* TODO: Media picker */ }}>
                <Image color="#ec4899" size={24} />
                <Text style={styles.toolText}>Photos & Videos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolItem} onPress={() => { setShowToolsMenu(false); setShowShareContact(true); }}>
                <User color="#06b6d4" size={24} />
                <Text style={styles.toolText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {showCreatePoll && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.createModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Poll</Text>
                <TouchableOpacity onPress={() => setShowCreatePoll(false)}><X color="#666" size={24} /></TouchableOpacity>
              </View>
              <TextInput style={styles.modalInput} placeholder="Question" value={pollQuestion} onChangeText={setPollQuestion} />
              {pollOptions.map((opt, i) => (
                <TextInput key={i} style={styles.modalInput} placeholder={`Option ${i + 1}`} value={opt} onChangeText={(text) => {
                  const newOpts = [...pollOptions];
                  newOpts[i] = text;
                  setPollOptions(newOpts);
                }} />
              ))}
              <TouchableOpacity style={styles.addOptionButton} onPress={() => setPollOptions([...pollOptions, ''])}>
                <Text style={styles.addOptionText}>+ Add Option</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleCreatePoll}>
                <Text style={styles.createButtonText}>Create Poll</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {showCreateEvent && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.createModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Event</Text>
                <TouchableOpacity onPress={() => setShowCreateEvent(false)}><X color="#666" size={24} /></TouchableOpacity>
              </View>
              <TextInput style={styles.modalInput} placeholder="Event Title" value={eventTitle} onChangeText={setEventTitle} />
              <TextInput style={styles.modalInput} placeholder="Description" value={eventDescription} onChangeText={setEventDescription} multiline />
              <TextInput style={styles.modalInput} placeholder="Location" value={eventLocation} onChangeText={setEventLocation} />
              <TextInput style={styles.modalInput} placeholder="Date (YYYY-MM-DD)" value={eventDate} onChangeText={setEventDate} />
              <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
                <Text style={styles.createButtonText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {showCreateAnnouncement && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.createModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Announcement</Text>
                <TouchableOpacity onPress={() => setShowCreateAnnouncement(false)}><X color="#666" size={24} /></TouchableOpacity>
              </View>
              <TextInput style={styles.modalInput} placeholder="Title" value={announcementTitle} onChangeText={setAnnouncementTitle} />
              <TextInput style={[styles.modalInput, styles.textArea]} placeholder="Content" value={announcementContent} onChangeText={setAnnouncementContent} multiline numberOfLines={4} />
              <TouchableOpacity style={styles.createButton} onPress={handleCreateAnnouncement}>
                <Text style={styles.createButtonText}>Create Announcement</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {showCalendar && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.calendarModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Upcoming Events</Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)}><X color="#666" size={24} /></TouchableOpacity>
              </View>
              <ScrollView>
                {events.filter((e: any) => new Date(e.startDate) > new Date()).map((event: any) => (
                  <View key={event._id} style={styles.calendarEventCard}>
                    <Text style={styles.calendarEventTitle}>{event.title}</Text>
                    <Text style={styles.calendarEventDate}>{new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                    {event.location && <Text style={styles.calendarEventLocation}>📍 {event.location}</Text>}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {showShareContact && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.createModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Share Contact</Text>
                <TouchableOpacity onPress={() => { setShowShareContact(false); setSelectedContact(null); setContactSource('community'); }}>
                  <X color="#666" size={24} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.contactSourceToggle}>
                <TouchableOpacity
                  style={[styles.sourceButton, contactSource === 'community' && styles.sourceButtonActive]}
                  onPress={() => setContactSource('community')}
                >
                  <Text style={[styles.sourceButtonText, contactSource === 'community' && styles.sourceButtonTextActive]}>
                    Community
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sourceButton, contactSource === 'device' && styles.sourceButtonActive]}
                  onPress={() => { setContactSource('device'); loadDeviceContacts(); }}
                >
                  <Text style={[styles.sourceButtonText, contactSource === 'device' && styles.sourceButtonTextActive]}>
                    Device
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.contactsList}>
                {(contactSource === 'community' ? communityMembers : deviceContacts).map((member: any, index: number) => {
                  const memberId = member._id || member.id || index;
                  const memberUserId = member.userId || member._id;
                  const isRegistered = contactSource === 'community' || member.isRegistered;
                  return (
                    <TouchableOpacity
                      key={memberId}
                      style={[
                        styles.contactItem,
                        selectedContact?.id === memberId && styles.contactItemSelected
                      ]}
                      onPress={() => setSelectedContact({ ...member, id: memberId, userId: memberUserId, isRegistered })}
                    >
                      <View style={styles.contactAvatar}>
                        <Text style={styles.contactAvatarText}>{member.name?.[0]?.toUpperCase() || '?'}</Text>
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{member.name}</Text>
                        <Text style={styles.contactDetails}>
                          {member.phoneNumber || member.phoneNumbers?.[0]?.number || member.email || member.emails?.[0]?.email || 'No contact info'}
                        </Text>
                        {isRegistered && <Text style={styles.registeredBadge}>✓ On Alumzi</Text>}
                      </View>
                      {selectedContact?.id === memberId && (
                        <Check color="#075E54" size={24} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={[styles.createButton, !selectedContact && styles.createButtonDisabled]}
                onPress={handleShareContact}
                disabled={!selectedContact}
              >
                <Text style={styles.createButtonText}>Share Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#075E54', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backButton: { padding: 8 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)' },
  infoButton: { padding: 8, position: 'relative' },
  badge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  joinRequestsBanner: { backgroundColor: '#e0e7ff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#667eea' },
  joinRequestsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  joinRequestsTitle: { fontSize: 14, fontWeight: '700', color: '#667eea' },
  viewAllText: { fontSize: 13, color: '#667eea', fontWeight: '600' },
  joinRequestsList: { flexDirection: 'row' },
  joinRequestCard: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginRight: 12, alignItems: 'center', width: 100, borderWidth: 1, borderColor: '#667eea' },
  requestAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  requestAvatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  requestName: { fontSize: 13, fontWeight: '600', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  requestActions: { flexDirection: 'row', gap: 6 },
  approveBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  announcementsSection: { backgroundColor: '#fef3c7', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f59e0b' },
  announcementHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  announcementHeaderText: { fontSize: 14, fontWeight: '700', color: '#f59e0b' },
  announcementCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  announcementTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  announcementContent: { fontSize: 14, color: '#666' },
  messagesList: { padding: 8 },
  pollCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, marginHorizontal: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  pollHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pollQuestion: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  pollOption: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative', overflow: 'hidden' },
  pollOptionVoted: { borderWidth: 2, borderColor: '#667eea' },
  pollBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#e0e7ff' },
  pollOptionContent: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  pollOptionText: { fontSize: 15, color: '#1a1a1a', fontWeight: '600' },
  pollVotes: { fontSize: 14, color: '#667eea', fontWeight: '700' },
  pollFooter: { fontSize: 12, color: '#999', marginTop: 8 },
  eventCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, marginHorizontal: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  eventHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  eventDate: { fontSize: 14, color: '#10b981', fontWeight: '600' },
  eventLocation: { fontSize: 13, color: '#666', marginTop: 4 },
  eventDescription: { fontSize: 14, color: '#666', marginBottom: 12 },
  eventActions: { flexDirection: 'row', gap: 8 },
  eventButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f8f9fa', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  eventButtonActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  eventButtonText: { fontSize: 14, fontWeight: '600', color: '#666' },
  eventButtonTextActive: { color: '#fff' },
  messageRow: { flexDirection: 'row', marginBottom: 4, paddingHorizontal: 8 },
  ownMessageRow: { justifyContent: 'flex-end' },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  ownBubble: { backgroundColor: '#DCF8C6', borderBottomRightRadius: 2 },
  otherBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 2 },
  senderName: { fontSize: 12, fontWeight: '600', color: '#075E54', marginBottom: 3 },
  messageText: { fontSize: 15, color: '#000', lineHeight: 20 },
  messageTime: { fontSize: 11, color: '#667781', marginTop: 2 },
  contactMessageBubble: { maxWidth: '75%', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 8, marginBottom: 8 },
  contactCardAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#075E54', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactCardAvatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  contactCardInfo: { flex: 1 },
  contactCardName: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
  contactCardDetail: { fontSize: 13, color: '#666', marginBottom: 2 },
  chatContactButton: { backgroundColor: '#075E54', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  chatContactButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', padding: 8, backgroundColor: '#F0F0F0', alignItems: 'flex-end', gap: 8 },
  plusButton: { padding: 10, justifyContent: 'center' },
  input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#075E54', alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  toolsMenu: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  toolsTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  toolItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16, borderRadius: 12, backgroundColor: '#f8f9fa', marginBottom: 12 },
  toolText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  createModal: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginHorizontal: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  modalInput: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  textArea: { height: 100, textAlignVertical: 'top' },
  addOptionButton: { padding: 12, alignItems: 'center' },
  addOptionText: { color: '#667eea', fontSize: 15, fontWeight: '600' },
  createButton: { backgroundColor: '#075E54', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  createButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  calendarModal: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginHorizontal: 20, maxHeight: '80%' },
  calendarEventCard: { backgroundColor: '#f8f9fa', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#10b981' },
  calendarEventTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  calendarEventDate: { fontSize: 14, color: '#10b981', marginBottom: 4 },
  calendarEventLocation: { fontSize: 13, color: '#666' },
  contactsList: { maxHeight: 400, marginBottom: 16 },
  contactItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#f8f9fa', marginBottom: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  contactItemSelected: { backgroundColor: '#e0f2f1', borderColor: '#075E54' },
  contactAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#075E54', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactAvatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  contactDetails: { fontSize: 13, color: '#666' },
  registeredBadge: { fontSize: 12, color: '#10b981', fontWeight: '600', marginTop: 2 },
  createButtonDisabled: { opacity: 0.5 },
  contactSourceToggle: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 12, padding: 4, marginBottom: 16 },
  sourceButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  sourceButtonActive: { backgroundColor: '#075E54' },
  sourceButtonText: { fontSize: 15, fontWeight: '600', color: '#666' },
  sourceButtonTextActive: { color: '#fff' },
});
