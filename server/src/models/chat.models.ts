import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system' | 'poll' | 'event';
  pollId?: string;
  eventId?: string;
  timestamp: Date;
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  replyTo?: string;
  edited?: boolean;
  editedAt?: Date;
  isPinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: Date;
  mentions?: string[];
  isStarred?: boolean;
  starredBy?: string[];
  isForwarded?: boolean;
  forwardedFrom?: string;
  deliveryStatus?: 'pending' | 'sent' | 'delivered' | 'read';
}

export interface IChat extends Document {
  associationId: string;
  groupId?: string;
  type: 'group' | 'direct';
  name?: string;
  participants: Array<{
    userId: string;
    role: 'admin' | 'member';
    joinedAt: Date;
    lastSeen?: Date;
  }>;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  chatId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'file', 'system', 'poll', 'event'], default: 'text' },
  pollId: { type: String },
  eventId: { type: String },
  timestamp: { type: Date, default: Date.now },
  readBy: [{
    userId: { type: String, required: true },
    readAt: { type: Date, default: Date.now }
  }],
  replyTo: { type: String },
  edited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isPinned: { type: Boolean, default: false },
  pinnedBy: { type: String },
  pinnedAt: { type: Date },
  mentions: [{ type: String }],
  isStarred: { type: Boolean, default: false },
  starredBy: [{ type: String }],
  isForwarded: { type: Boolean, default: false },
  forwardedFrom: { type: String },
  deliveryStatus: { type: String, enum: ['pending', 'sent', 'delivered', 'read'], default: 'sent' }
});

const ChatSchema = new Schema<IChat>({
  associationId: { type: String, required: true, index: true },
  groupId: { type: String, index: true },
  type: { type: String, enum: ['group', 'direct'], required: true },
  name: { type: String },
  participants: [{
    userId: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date }
  }],
  lastMessage: {
    content: { type: String },
    senderId: { type: String },
    timestamp: { type: Date }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
export const Chat = mongoose.model<IChat>('Chat', ChatSchema);