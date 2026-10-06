import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  groupId: mongoose.Types.ObjectId;
  communityId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  responses: Array<{
    userId: mongoose.Types.ObjectId;
    status: 'going' | 'maybe' | 'not_going';
    respondedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  communityId: { type: Schema.Types.ObjectId, ref: 'Association', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  responses: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['going', 'maybe', 'not_going'], required: true },
    respondedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model<IEvent>('Event', EventSchema);
