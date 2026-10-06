import { Document, model, models, Schema } from "mongoose";

export interface IBulkImportJob extends Document {
    associationId: Schema.Types.ObjectId;
    createdBy: Schema.Types.ObjectId;
    fileName: string;
    totalRecords: number;
    processedRecords: number;
    successCount: number;
    failureCount: number;
    duplicateCount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    results: Array<{
        row: number;
        name: string;
        email?: string;
        phone?: string;
        status: 'success' | 'failed' | 'duplicate';
        message?: string;
        memberId?: Schema.Types.ObjectId;
    }>;
    errorMessage?: string;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const BulkImportJobSchema = new Schema({
    associationId: {
        type: Schema.Types.ObjectId,
        ref: 'Association',
        required: true,
        index: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    totalRecords: {
        type: Number,
        required: true,
        default: 0
    },
    processedRecords: {
        type: Number,
        default: 0
    },
    successCount: {
        type: Number,
        default: 0
    },
    failureCount: {
        type: Number,
        default: 0
    },
    duplicateCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
        index: true
    },
    results: [{
        row: Number,
        name: String,
        email: String,
        phone: String,
        status: {
            type: String,
            enum: ['success', 'failed', 'duplicate']
        },
        message: String,
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Member'
        }
    }],
    errorMessage: String,
    startedAt: Date,
    completedAt: Date
}, {
    timestamps: true
});

BulkImportJobSchema.index({ associationId: 1, status: 1 });
BulkImportJobSchema.index({ createdBy: 1, createdAt: -1 });

const BulkImportJob = models.BulkImportJob ?? model<IBulkImportJob>("BulkImportJob", BulkImportJobSchema);
export default BulkImportJob;
