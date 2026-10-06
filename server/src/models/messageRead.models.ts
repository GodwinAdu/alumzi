import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageRead extends Document {
    messageId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    readAt: Date;
}

const MessageReadSchema = new Schema<IMessageRead>({
    messageId: {
        type: Schema.Types.ObjectId,
        ref: 'Message',
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    readAt: {
        type: Date,
        default: Date.now
    }
});

MessageReadSchema.index({ messageId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IMessageRead>('MessageRead', MessageReadSchema);
