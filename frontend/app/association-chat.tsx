import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Send, ArrowLeft, Trash2 } from 'lucide-react-native';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { useChatMessages, useSendMessage, useDeleteMessage, ChatMessage } from '@/hooks/useChat';
import { useSocket } from '@/contexts/SocketContext';

export default function AssociationChatPage() {
  const router = useRouter();
  const { associationId } = useLocalSearchParams();
  const { selectedAssociation } = useAssociation();
  const { user } = useAuth();
  const { data: membersData } = useMembers(associationId as string);
  const { joinChatRoom, leaveChatRoom } = useSocket();
  
  const [message, setMessage] = useState('');
  
  // Real API calls
  const { data: chatData, isLoading } = useChatMessages(associationId as string);
  const sendMessageMutation = useSendMessage();
  const deleteMessageMutation = useDeleteMessage();
  
  const messages: ChatMessage[] = chatData?.messages || [];
  const scrollViewRef = useRef<ScrollView>(null);
  const members = membersData?.members || [];
  const currentMember = members.find(m => m.userId === user?.id);

  useEffect(() => {
    if (associationId) {
      joinChatRoom(associationId as string);
      return () => leaveChatRoom(associationId as string);
    }
  }, [associationId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !associationId) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        associationId: associationId as string,
        text: message.trim(),
      });
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!associationId || !messageId) return;
    
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessageMutation.mutateAsync({
                associationId: associationId as string,
                messageId,
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderMessage = (msg: ChatMessage, index: number) => {
    if (!msg || !msg.id || !msg.senderId) {
      return null; // Skip invalid messages
    }
    
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDate = !prevMessage || 
      formatDate(msg.timestamp) !== formatDate(prevMessage.timestamp);
    
    const isOwn = msg.senderId === user?.id;
    // Always show sender name for group chat (WhatsApp style)
    const showSender = !prevMessage || 
      prevMessage.senderId !== msg.senderId || 
      new Date(msg.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 300000; // 5 minutes

    return (
      <View key={msg.id}>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(msg.timestamp)}</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}
          onLongPress={() => isOwn && msg?.id && handleDeleteMessage(msg.id)}
          delayLongPress={500}
        >
          {showSender && (
            <Text style={[styles.senderName, isOwn ? styles.ownSenderName : styles.otherSenderName]}>
              {isOwn ? 'You' : msg.senderName}
            </Text>
          )}
          <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
            {msg.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
              {formatTime(msg.timestamp)}
            </Text>
            {msg.isEdited && (
              <Text style={styles.editedText}>edited</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: selectedAssociation?.name || 'Group Chat',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color="#667eea" size={20} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <Text style={styles.memberCount}>{members.length} members</Text>
          ),
        }} 
      />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.filter(msg => msg && msg.id && msg.senderId).map((msg, index) => renderMessage(msg, index))}
        </ScrollView>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!message.trim() || sendMessageMutation.isPending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send color={message.trim() && !sendMessageMutation.isPending ? "#fff" : "#ccc"} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  backButton: {
    padding: 8,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '600' as const,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 2,
    padding: 12,
    borderRadius: 18,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  ownSenderName: {
    color: '#075e54', // Dark green for own messages
  },
  otherSenderName: {
    color: '#667eea', // Blue for other messages
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#000',
  },
  otherMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  ownTimestamp: {
    color: '#666',
  },
  otherTimestamp: {
    color: '#999',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  editedText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
});