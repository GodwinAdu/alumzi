import { Document, model, models, Schema } from "mongoose";

export interface IAssociation extends Document {
    name: string;
    type: 'school' | 'community';
    description?: string;
    code: string; // Unique join code
    createdBy: Schema.Types.ObjectId;
    
    // Admin moderation fields
    status: 'pending' | 'approved' | 'blocked' | 'banned';
    moderationReason?: string;
    moderatedBy?: Schema.Types.ObjectId;
    moderatedAt?: Date;
    isActive: boolean;
    
    // School-specific fields
    schoolInfo?: {
        establishedYear?: number;
        address?: string;
        phoneNumber?: string;
        email?: string;
        schoolType?: 'public' | 'private' | 'charter';
        website?: string;
        studentCapacity?: number;
    };

    
    // Community-specific fields
    communityInfo?: {
        foundedYear?: number;
        location?: string;
        contactPhone?: string;
        contactEmail?: string;
        membershipFee?: number;
        meetingSchedule?: string;
        focusAreas?: string[]; // e.g., ['education', 'health', 'environment']
        organizationType?: 'nonprofit' | 'religious' | 'social' | 'professional';
        website?: string;
        maxMembers?: number;
    };
    city?: string;
    country?: string;
    
    members: Array<{
        userId: Schema.Types.ObjectId;
        role: 'admin' | 'moderator' | 'member';
        joinedAt: Date;
        isActive: boolean;
        invitedBy?: Schema.Types.ObjectId;
        status: 'active' | 'pending' | 'suspended';
    }>;
    
    // Additional useful fields
    avatar?: string; // Association profile image
    banner?: string; // Cover/banner image
    currency?: string; // Default currency for financial operations
    timezone?: string; // Association timezone
    
    // Payment integration settings
    paymentSettings?: {
        paystack?: {
            enabled: boolean;
            publicKey?: string;
            secretKey?: string; // Encrypted
            webhookSecret?: string; // Encrypted
        };
    };
    
    socialLinks?: {
        website?: string;
        facebook?: string;
        twitter?: string;
        instagram?: string;
        linkedin?: string;
    };
    
    // Statistics (computed fields)
    stats?: {
        totalMembers: number;
        activeMembers: number;
        totalIncome: number;
        totalExpenses: number;
        lastActivity: Date;
    };
    settings: {
        // Visibility settings (Community-level only)
        isPublic: boolean;
        requireApproval: boolean;
        
        // Member permissions (Community-level only)
        allowMemberInvites: boolean;
        
        // Security settings (Community-level only)
        security: {
            requireTwoFactorForAdmins: boolean;
            allowGuestAccess: boolean;
            sessionTimeout: number;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

const AssociationSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['school', 'community'],
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Admin moderation fields
    status: {
        type: String,
        enum: ['pending', 'approved', 'blocked', 'banned'],
        default: 'pending'
    },
    moderationReason: {
        type: String,
        trim: true
    },
    moderatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    moderatedAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // School-specific fields
    schoolInfo: {
        establishedYear: Number,
        address: String,
        phoneNumber: String,
        email: String,
        schoolType: {
            type: String,
            enum: ['public', 'private', 'charter']
        },
        website: String,
        studentCapacity: Number
    },
    
    // Community-specific fields
    communityInfo: {
        foundedYear: Number,
        location: String,
        contactPhone: String,
        contactEmail: String,
        membershipFee: Number,
        meetingSchedule: String,
        focusAreas: [String],
        organizationType: {
            type: String,
            enum: ['nonprofit', 'religious', 'social', 'professional']
        },
        website: String,
        maxMembers: Number
    },
    city: {
        type: String,
        trim: true,
    },
    country: {
        type: String,
        trim: true
    },
    members: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'moderator', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['active', 'pending', 'suspended'],
            default: 'active'
        }
    }],
    
    // Additional fields
    avatar: String,
    banner: String,
    currency: {
        type: String,
        default: 'USD'
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    
    // Payment integration settings
    paymentSettings: {
        paystack: {
            enabled: {
                type: Boolean,
                default: false
            },
            publicKey: String,
            secretKey: String, // Should be encrypted
            webhookSecret: String // Should be encrypted
        }
    },
    
    socialLinks: {
        website: String,
        facebook: String,
        twitter: String,
        instagram: String,
        linkedin: String
    },
    
    stats: {
        totalMembers: {
            type: Number,
            default: 0
        },
        activeMembers: {
            type: Number,
            default: 0
        },
        totalIncome: {
            type: Number,
            default: 0
        },
        totalExpenses: {
            type: Number,
            default: 0
        },
        lastActivity: {
            type: Date,
            default: Date.now
        }
    },
    settings: {
        // Visibility settings
        isPublic: {
            type: Boolean,
            default: true
        },
        requireApproval: {
            type: Boolean,
            default: true
        },
        
        // Member permissions
        allowMemberInvites: {
            type: Boolean,
            default: true
        },
        
        // Security settings
        security: {
            requireTwoFactorForAdmins: {
                type: Boolean,
                default: false
            },
            allowGuestAccess: {
                type: Boolean,
                default: false
            },
            sessionTimeout: {
                type: Number,
                default: 60
            }
        }
    }
}, {
    timestamps: true
});

const Association = models.Association ?? model<IAssociation>("Association", AssociationSchema);

export default Association;