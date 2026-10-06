import mongoose, { Schema, Document } from 'mongoose';

export interface IDuesPayment extends Document {
    groupId: mongoose.Types.ObjectId;
    memberId: mongoose.Types.ObjectId;
    amount: number;
    period: string; // e.g., "2024-01", "2024-Q1", "2024-W01"
    dueDate: Date;
    paidDate?: Date;
    status: 'pending' | 'paid' | 'overdue';
    paymentMethod?: 'paystack' | 'manual' | 'bank_transfer';
    paystackReference?: string;
    transactionId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DuesPaymentSchema = new Schema<IDuesPayment>({
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
        index: true
    },
    memberId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    period: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: true,
        index: true
    },
    paidDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue'],
        default: 'pending',
        index: true
    },
    paymentMethod: {
        type: String,
        enum: ['paystack', 'manual', 'bank_transfer']
    },
    paystackReference: {
        type: String,
        sparse: true
    },
    transactionId: {
        type: String,
        sparse: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
DuesPaymentSchema.index({ groupId: 1, memberId: 1, period: 1 }, { unique: true });
DuesPaymentSchema.index({ groupId: 1, status: 1 });
DuesPaymentSchema.index({ memberId: 1, status: 1 });

export default mongoose.model<IDuesPayment>('DuesPayment', DuesPaymentSchema);