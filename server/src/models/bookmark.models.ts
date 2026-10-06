import mongoose, { Schema, Document } from 'mongoose';

export interface IBookmark extends Document {
    userId: mongoose.Types.ObjectId;
    messageId: mongoose.Types.ObjectId;
    groupId: mongoose.Types.ObjectId;
    note?: string;
    createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    messageId: {
        type: Schema.Types.ObjectId,
        ref: 'Message',
        required: true,
        index: true
    },
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    note: {
        type: String,
        trim: true,
        maxlength: 200
    }
}, {
    timestamps: true
});

BookmarkSchema.index({ userId: 1, messageId: 1 }, { unique: true });

export default mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
