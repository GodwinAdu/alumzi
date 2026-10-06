import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Users, Plus, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAssociation } from '@/contexts/AssociationContext';
import { api } from '@/lib/api';

export default function ChatPage() {
  const { userAssociations } = useAssociation();
  const selectedAssociation = userAssociations?.[0];
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedAssociation?.id) {
      fetchChats();
      // Auto-open default chat if no chats exist
      checkAndOpenDefaultChat();
    }
  }, [selectedAssociation?.id]);

  const checkAndOpenDefaultChat = async () => {
    try {
      const { chats: chatsList } = await api.getAssociationChats(selectedAssociation?.id || '');
      if (!chatsList || chatsList.length === 0) {
        const { chat } = await api.getDefaultChat(selectedAssociation?.id || '');
        setChats([chat]);
      }
    } catch (error) {
      console.error('Error checking default chat:', error);
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const { chats: chatsList } = await api.getAssociationChats(selectedAssociation?.id || '');
      setChats(chatsList || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDefaultChat = async () => {
    try {
      const { chat } = await api.getDefaultChat(selectedAssociation?.id || '');
      router.push(`/chat-room?chatId=${chat._id}`);
    } catch (error) {
      console.error('Error opening default chat:', error);
    }
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.subtitle}>{selectedAssociation?.name}</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={openDefaultChat}>
          <MessageCircle color="#667eea" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={openDefaultChat}>
          <Users color="#667eea" size={20} />
          <Text style={styles.actionText}>Group Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/members')}
        >
          <MessageCircle color="#667eea" size={20} />
          <Text style={styles.actionText}>Direct Message</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading chats...</Text>
          </View>
        ) : chats.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle color="#ccc" size={48} />
            <Text style={styles.emptyTitle}>Loading chat...</Text>
            <Text style={styles.emptyText}>Setting up your association chat</Text>
          </View>
        ) : (
          <View style={styles.chatsList}>
            {chats.map(chat => (
              <TouchableOpacity
                key={chat._id}
                style={styles.chatCard}
                onPress={() => router.push(`/chat-room?chatId=${chat._id}`)}
              >
                <View style={styles.chatAvatar}>
                  {chat.type === 'group' ? (
                    <Users color="#fff" size={24} />
                  ) : (
                    <MessageCircle color="#fff" size={24} />
                  )}
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>
                      {chat.name || (chat.type === 'direct' ? 'Direct Message' : 'Group Chat')}
                    </Text>
                    {chat.lastMessage && (
                      <Text style={styles.chatTime}>
                        {formatLastMessageTime(chat.lastMessage.timestamp)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {chat.lastMessage?.content || 'No messages yet'}
                  </Text>
                  <Text style={styles.participantCount}>
                    {chat.participants?.length || 0} members
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  createButton: {
    padding: 8,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createFirstChat: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createFirstChatText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatsList: {
    gap: 12,
  },
  chatCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  participantCount: {
    fontSize: 12,
    color: '#999',
  },
});