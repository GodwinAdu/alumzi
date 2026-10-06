import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  groupId: mongoose.Types.ObjectId;
  communityId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  communityId: { type: Schema.Types.ObjectId, ref: 'Association', required: true, index: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isPinned: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
