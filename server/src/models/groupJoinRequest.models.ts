import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupJoinRequest extends Document {
    groupId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: Date;
    processedAt?: Date;
    processedBy?: mongoose.Types.ObjectId;
}

const GroupJoinRequestSchema = new Schema<IGroupJoinRequest>({
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
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: Date,
    processedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

GroupJoinRequestSchema.index({ groupId: 1, userId: 1 }, { unique: true });
GroupJoinRequestSchema.index({ groupId: 1, status: 1 });

export default mongoose.model<IGroupJoinRequest>('GroupJoinRequest', GroupJoinRequestSchema);
