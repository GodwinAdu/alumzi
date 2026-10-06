import { Document, model, models, Schema } from "mongoose";

export interface IInvitation extends Document {
    associationId: Schema.Types.ObjectId;
    invitedBy: Schema.Types.ObjectId;
    inviteeEmail?: string;
    inviteePhone?: string;
    inviteeName?: string;
    invitationCode: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    expiresAt: Date;
    acceptedAt?: Date;
    acceptedBy?: Schema.Types.ObjectId;
    metadata?: {
        source: 'email' | 'sms' | 'qr' | 'link';
        sentAt?: Date;
        deliveryStatus?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const InvitationSchema = new Schema({
    associationId: {
        type: Schema.Types.ObjectId,
        ref: 'Association',
        required: true,
        index: true
    },
    invitedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    inviteeEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    inviteePhone: {
        type: String,
        trim: true
    },
    inviteeName: {
        type: String,
        trim: true
    },
    invitationCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'expired', 'cancelled'],
        default: 'pending',
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    acceptedAt: Date,
    acceptedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    metadata: {
        source: {
            type: String,
            enum: ['email', 'sms', 'qr', 'link']
        },
        sentAt: Date,
        deliveryStatus: String
    }
}, {
    timestamps: true
});

InvitationSchema.index({ associationId: 1, status: 1 });
InvitationSchema.index({ invitationCode: 1, status: 1 });

const Invitation = models.Invitation ?? model<IInvitation>("Invitation", InvitationSchema);
export default Invitation;
