import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
    communityId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    type: 'announcement' | 'finance' | 'events' | 'general' | 'custom';
    icon?: string;
    avatar?: string;
    banner?: string;
    isDefault: boolean;
    settings: {
        // Privacy & Join settings
        isPublic: boolean;
        requireApproval: boolean;
        
        // Posting permissions
        onlyAdminsCanPost: boolean;
        allowMemberInvites: boolean;
        showInCommunity: boolean;
        
        // Financial settings
        financial: {
            allowMemberContributions: boolean;
            requireReceiptUpload: boolean;
            autoApproveExpenses: boolean;
            expenseApprovalLimit: number;
            autoApproveIncome: boolean;
        };
        
        // Notification settings
        notifications: {
            financialUpdates: boolean;
            incomeRecorded: boolean;
            expenseRecorded: boolean;
            newMembers: boolean;
            memberLeft: boolean;
            monthlyReports: boolean;
        };
        
        // Dues settings
        dues: {
            enabled: boolean;
            amount: number;
            frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
            dueDate: number;
            description: string;
        };
        
        // Privacy settings
        privacy: {
            showFinancials: boolean;
            showMemberList: boolean;
            allowDataExport: boolean;
        };
    };
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    memberCount: number;
}

const GroupSchema = new Schema<IGroup>({
    communityId: {
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
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['announcement', 'finance', 'events', 'general', 'custom'],
        default: 'general'
    },
    icon: {
        type: String,
        trim: true
    },
    avatar: {
        type: String,
        trim: true
    },
    banner: {
        type: String,
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    settings: {
        isPublic: {
            type: Boolean,
            default: true
        },
        requireApproval: {
            type: Boolean,
            default: false
        },
        onlyAdminsCanPost: {
            type: Boolean,
            default: false
        },
        allowMemberInvites: {
            type: Boolean,
            default: true
        },
        showInCommunity: {
            type: Boolean,
            default: true
        },
        financial: {
            allowMemberContributions: {
                type: Boolean,
                default: true
            },
            requireReceiptUpload: {
                type: Boolean,
                default: false
            },
            autoApproveExpenses: {
                type: Boolean,
                default: false
            },
            expenseApprovalLimit: {
                type: Number,
                default: 1000
            },
            autoApproveIncome: {
                type: Boolean,
                default: true
            }
        },
        notifications: {
            financialUpdates: {
                type: Boolean,
                default: true
            },
            incomeRecorded: {
                type: Boolean,
                default: false
            },
            expenseRecorded: {
                type: Boolean,
                default: false
            },
            newMembers: {
                type: Boolean,
                default: true
            },
            memberLeft: {
                type: Boolean,
                default: false
            },
            monthlyReports: {
                type: Boolean,
                default: true
            }
        },
        dues: {
            enabled: {
                type: Boolean,
                default: false
            },
            amount: {
                type: Number,
                default: 0
            },
            frequency: {
                type: String,
                enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
                default: 'monthly'
            },
            dueDate: {
                type: Number,
                default: 1
            },
            description: {
                type: String,
                default: 'Group dues payment'
            }
        },
        privacy: {
            showFinancials: {
                type: Boolean,
                default: true
            },
            showMemberList: {
                type: Boolean,
                default: true
            },
            allowDataExport: {
                type: Boolean,
                default: false
            }
        }
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    memberCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

GroupSchema.index({ communityId: 1, type: 1 });
GroupSchema.index({ communityId: 1, name: 1 });

export default mongoose.model<IGroup>('Group', GroupSchema);
