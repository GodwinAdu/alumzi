import mongoose, { Schema, Document } from 'mongoose';

export interface IGuestMember extends Document {
    associationId: mongoose.Types.ObjectId;
    name: string;
    email?: string;
    phoneNumber?: string;
    role: 'member' | 'moderator';
    status: 'active' | 'suspended';
    joinedAt: Date;
    addedBy: mongoose.Types.ObjectId;
    notes?: string;
}

const GuestMemberSchema = new Schema<IGuestMember>({
    associationId: {
        type: Schema.Types.ObjectId,
        ref: 'Association',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['member', 'moderator'],
        default: 'member'
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

GuestMemberSchema.index({ associationId: 1, phoneNumber: 1 });
GuestMemberSchema.index({ associationId: 1, email: 1 });

export default mongoose.model<IGuestMember>('GuestMember', GuestMemberSchema);
