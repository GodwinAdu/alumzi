import mongoose, { Schema, Document } from 'mongoose';

export interface IPoll extends Document {
  groupId: mongoose.Types.ObjectId;
  communityId: mongoose.Types.ObjectId;
  question: string;
  options: Array<{
    text: string;
    votes: Array<{
      userId: mongoose.Types.ObjectId;
      votedAt: Date;
    }>;
  }>;
  createdBy: mongoose.Types.ObjectId;
  expiresAt?: Date;
  allowMultiple: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PollSchema = new Schema<IPoll>({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  communityId: { type: Schema.Types.ObjectId, ref: 'Association', required: true, index: true },
  question: { type: String, required: true },
  options: [{
    text: { type: String, required: true },
    votes: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      votedAt: { type: Date, default: Date.now }
    }]
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date },
  allowMultiple: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IPoll>('Poll', PollSchema);
