import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Info, DollarSign, Settings, Send, Pin, AtSign, Smile, Bookmark, Eye, Edit3, Star, Forward } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥'];

export default function GroupChatScreen() {
  const router = useRouter();
  const { groupId, groupName, associationId, isDefault } = useLocalSearchParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [showPinned, setShowPinned] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [editText, setEditText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const isDefaultGroup = isDefault === 'true';

  const { data: messagesData, refetch } = useQuery({
    queryKey: ['groupMessages', groupId],
    queryFn: () => api.get(`/groups/${groupId}/messages`),
    enabled: !!groupId,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => {
      console.log('📤 [Frontend] Sending message:', { groupId, text });
      return api.post(`/groups/${groupId}/messages`, { text });
    },
    onSuccess: (data) => {
      console.log('✅ [Frontend] Message sent successfully:', data);
      setMessage('');
      refetch();
    },
    onError: (error: any) => {
      console.error('❌ [Frontend] Failed to send message:', error);
    },
  });

  const reactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) => 
      api.addReaction(messageId, emoji),
    onSuccess: () => refetch(),
  });

  const bookmarkMutation = useMutation({
    mutationFn: (messageId: string) => 
      api.bookmarkMessage(messageId, groupId as string),
    onSuccess: () => {
      setSelectedMessage(null);
      refetch();
    },
  });

  const pinMutation = useMutation({
    mutationFn: (messageId: string) => api.pinMessage(messageId),
    onSuccess: () => refetch(),
  });

  const unpinMutation = useMutation({
    mutationFn: (messageId: string) => api.unpinMessage(messageId),
    onSuccess: () => refetch(),
  });

  const editMutation = useMutation({
    mutationFn: ({ messageId, text }: { messageId: string; text: string }) => 
      api.editMessage(messageId, text),
    onSuccess: () => {
      setEditingMessage(null);
      setEditText('');
      refetch();
    },
  });

  const starMutation = useMutation({
    mutationFn: (messageId: string) => api.starMessage(messageId),
    onSuccess: () => {
      setSelectedMessage(null);
      refetch();
    },
  });

  const forwardMutation = useMutation({
    mutationFn: ({ messageId, groupId }: { messageId: string; groupId: string }) => 
      api.forwardMessage(messageId, groupId),
    onSuccess: () => {
      setShowForwardModal(false);
      setSelectedMessage(null);
    },
  });

  const { data: pinnedData } = useQuery({
    queryKey: ['pinnedMessages', groupId],
    queryFn: () => api.getPinnedMessages(groupId as string),
    enabled: !!groupId && showPinned,
  });

  // Socket.IO for typing indicators
  useEffect(() => {
    if (!socket || !groupId) return;

    socket.emit('join-group', groupId);

    socket.on('user-typing', (data: { userId: string; userName: string }) => {
      if (data.userId !== user?.id) {
        setTypingUsers(prev => [...new Set([...prev, data.userName])]);
      }
    });

    socket.on('user-stopped-typing', (data: { userId: string; userName: string }) => {
      setTypingUsers(prev => prev.filter(name => name !== data.userName));
    });

    return () => {
      socket.off('user-typing');
      socket.off('user-stopped-typing');
      socket.emit('leave-group', groupId);
    };
  }, [socket, groupId, user?.id]);

  const handleTyping = (text: string) => {
    setMessage(text);

    if (socket && groupId) {
      socket.emit('typing', { groupId, userId: user?.id, userName: user?.name });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', { groupId, userId: user?.id });
      }, 2000);
    }
  };

  const messages = messagesData?.messages || [];
  const pinnedMessages = pinnedData?.messages || [];

  const handleSend = () => {
    console.log('🚀 [Frontend] handleSend called:', { message: message.trim(), groupId });
    if (message.trim()) {
      sendMutation.mutate(message.trim());
    }
  };

  const handleReaction = (emoji: string) => {
    if (selectedMessage) {
      reactionMutation.mutate({ messageId: selectedMessage.id, emoji });
      setShowEmojiPicker(false);
      setSelectedMessage(null);
    }
  };

  const handleBookmark = () => {
    if (selectedMessage) {
      bookmarkMutation.mutate(selectedMessage.id);
    }
  };

  const handleEdit = () => {
    if (selectedMessage) {
      setEditingMessage(selectedMessage);
      setEditText(selectedMessage.text);
      setSelectedMessage(null);
    }
  };

  const handleSaveEdit = () => {
    if (editingMessage && editText.trim()) {
      editMutation.mutate({ messageId: editingMessage.id, text: editText.trim() });
    }
  };

  const handleStar = () => {
    if (selectedMessage) {
      starMutation.mutate(selectedMessage.id);
    }
  };

  const handleForward = (targetGroupId: string) => {
    if (selectedMessage) {
      forwardMutation.mutate({ messageId: selectedMessage.id, groupId: targetGroupId });
    }
  };

  const handleMention = (userName: string) => {
    setMessage(prev => prev + `@${userName} `);
  };

  const renderMessage = ({ item }: any) => {
    const isOwnMessage = item.senderId === user?.id;
    const hasMention = item.mentions?.includes(user?.id);
    const reactions = item.reactions || {};
    const hasReactions = Object.keys(reactions).length > 0;
    
    return (
      <View style={[styles.messageRow, isOwnMessage && styles.ownMessageRow]}>
        <TouchableOpacity
          style={[styles.messageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble, hasMention && styles.mentionedMessage]}
          onLongPress={() => setSelectedMessage(item)}
        >
          {item.isPinned && (
            <View style={styles.pinnedBadge}>
              <Pin color="#667781" size={10} />
            </View>
          )}
          {!isOwnMessage && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          {item.isForwarded && (
            <Text style={styles.forwardedLabel}>Forwarded from {item.forwardedFrom}</Text>
          )}
          <Text style={styles.messageText}>{item.text}</Text>
          {item.isEdited && (
            <Text style={styles.editedLabel}>edited</Text>
          )}
          
          {hasReactions && (
            <View style={styles.reactionsContainer}>
              {Object.entries(reactions).map(([emoji, users]: [string, any]) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionBubble}
                  onPress={() => handleReaction(emoji)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={styles.reactionCount}>{users.length}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isOwnMessage && (
              <Text style={styles.checkmark}>✓✓</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerContent}
          onPress={() => router.push(`/group-info?groupId=${groupId}`)}
        >
          <Text style={styles.headerTitle}>{groupName}</Text>
          <Text style={styles.headerSubtitle}>Tap for group info</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => setShowPinned(!showPinned)}
        >
          <Pin color="#fff" size={24} />
        </TouchableOpacity>

        {!isDefaultGroup && (
          <>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => router.push(`/group-info?groupId=${groupId}`)}
            >
              <Info color="#fff" size={24} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => router.push(`/group-financial-dashboard?groupId=${groupId}&groupName=${groupName}`)}
            >
              <DollarSign color="#fff" size={24} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => router.push(`/group-settings?groupId=${groupId}&groupName=${groupName}`)}
            >
              <Settings color="#fff" size={24} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {showPinned && pinnedMessages.length > 0 && (
          <View style={styles.pinnedSection}>
            <Text style={styles.pinnedTitle}>Pinned Messages</Text>
            {pinnedMessages.map((msg: any) => (
              <View key={msg.id} style={styles.pinnedItem}>
                <Text style={styles.pinnedText} numberOfLines={1}>{msg.text}</Text>
              </View>
            ))}
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
        
        {typingUsers.length > 0 && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </Text>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          {editingMessage ? (
            <>
              <TextInput
                style={styles.input}
                value={editText}
                onChangeText={setEditText}
                placeholder="Edit message..."
                multiline
                maxLength={1000}
                autoFocus
              />
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setEditingMessage(null);
                  setEditText('');
                }}
              >
                <Text style={styles.cancelText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sendButton, !editText.trim() && styles.sendButtonDisabled]}
                onPress={handleSaveEdit}
                disabled={!editText.trim() || editMutation.isPending}
              >
                <Send color="#fff" size={20} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.mentionButton} onPress={() => handleMention('user')}>
                <AtSign color="#667eea" size={20} />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={handleTyping}
                placeholder="Type a message..."
                multiline
                maxLength={1000}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
              >
                <Send color="#fff" size={20} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {selectedMessage && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedMessage(null)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedMessage(null)}
          >
            <View style={styles.messageMenu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setShowEmojiPicker(true)}
              >
                <Smile color="#667eea" size={20} />
                <Text style={styles.menuText}>React</Text>
              </TouchableOpacity>
              
              {selectedMessage.senderId === user?.id && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleEdit}
                >
                  <Edit3 color="#667eea" size={20} />
                  <Text style={styles.menuText}>Edit</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleStar}
              >
                <Star color="#f59e0b" size={20} />
                <Text style={styles.menuText}>Star</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowForwardModal(true);
                  setSelectedMessage(null);
                }}
              >
                <Forward color="#667eea" size={20} />
                <Text style={styles.menuText}>Forward</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleBookmark}
              >
                <Bookmark color="#667eea" size={20} />
                <Text style={styles.menuText}>Bookmark</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  if (selectedMessage.isPinned) {
                    unpinMutation.mutate(selectedMessage.id);
                  } else {
                    pinMutation.mutate(selectedMessage.id);
                  }
                  setSelectedMessage(null);
                }}
              >
                <Pin color="#667eea" size={20} />
                <Text style={styles.menuText}>{selectedMessage.isPinned ? 'Unpin' : 'Pin'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => setSelectedMessage(null)}
              >
                <Text style={styles.menuText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {showEmojiPicker && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEmojiPicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEmojiPicker(false)}
          >
            <View style={styles.emojiPicker}>
              <Text style={styles.emojiPickerTitle}>React with</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.emojiButton}
                    onPress={() => handleReaction(emoji)}
                  >
                    <Text style={styles.emojiButtonText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {showForwardModal && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setShowForwardModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.forwardModal}>
              <Text style={styles.forwardTitle}>Forward to Group</Text>
              <Text style={styles.forwardSubtitle}>Select a group to forward this message</Text>
              <TouchableOpacity 
                style={styles.forwardButton}
                onPress={() => handleForward(groupId as string)}
              >
                <Text style={styles.forwardButtonText}>Current Group</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelForwardButton}
                onPress={() => setShowForwardModal(false)}
              >
                <Text style={styles.cancelForwardText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#075E54',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoButton: {
    padding: 8,
  },
  messagesList: {
    padding: 8,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    position: 'relative',
  },
  ownBubble: {
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#075E54',
    marginBottom: 3,
  },
  messageText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
    gap: 3,
  },
  messageTime: {
    fontSize: 11,
    color: '#667781',
  },
  checkmark: {
    fontSize: 14,
    color: '#53BDEB',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '600' as const,
  },
  mentionedMessage: {
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  pinnedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  pinnedSection: {
    backgroundColor: '#e0e7ff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#667eea',
  },
  pinnedTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#667eea',
    marginBottom: 8,
  },
  pinnedItem: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  pinnedText: {
    fontSize: 13,
    color: '#1a1a1a',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  mentionButton: {
    padding: 10,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  messageMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  menuText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600' as const,
  },
  emojiPicker: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonText: {
    fontSize: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#075E54',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  forwardedLabel: {
    fontSize: 11,
    color: '#667781',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  editedLabel: {
    fontSize: 10,
    color: '#667781',
    fontStyle: 'italic',
    marginTop: 2,
  },
  cancelButton: {
    padding: 10,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 18,
    color: '#ef4444',
  },
  forwardModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    maxHeight: '80%',
  },
  forwardTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  forwardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  forwardButton: {
    backgroundColor: '#075E54',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  forwardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  cancelForwardButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelForwardText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
