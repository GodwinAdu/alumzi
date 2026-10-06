import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupMember extends Document {
    groupId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    role: 'admin' | 'member';
    joinedAt: Date;
    isMuted: boolean;
}

const GroupMemberSchema = new Schema<IGroupMember>({
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    isMuted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IGroupMember>('GroupMember', GroupMemberSchema);
