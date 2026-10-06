export type Country = {
  id: string;
  name: string;
  code: string;
  flag?: string;
};

export type User = {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
  country?: string;
  createdAt: string;
};

export type AssociationType = 'school' | 'other';

export type MemberRole = 'admin' | 'moderator' | 'member';

export type MemberStatus = 'active' | 'suspended' | 'pending';

export type Member = {
  id: string;
  userId: string;
  associationId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  invitedBy?: string;
};

export type Association = {
  id: string;
  name: string;
  type: 'school' | 'community';
  code: string;
  description?: string;
  city?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  avatar?: string;
  banner?: string;
  createdBy: string;
  createdAt: string;
  
  schoolInfo?: {
    establishedYear?: number;
    address?: string;
    phoneNumber?: string;
    email?: string;
    schoolType?: 'public' | 'private' | 'charter';
    website?: string;
    studentCapacity?: number;
  };
  
  communityInfo?: {
    foundedYear?: number;
    location?: string;
    contactPhone?: string;
    contactEmail?: string;
    membershipFee?: number;
    meetingSchedule?: string;
    focusAreas?: string[];
    organizationType?: 'nonprofit' | 'religious' | 'social' | 'professional';
    website?: string;
    maxMembers?: number;
  };
  
  socialLinks?: {
    website?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  
  stats?: {
    totalMembers: number;
    activeMembers: number;
    totalIncome: number;
    totalExpenses: number;
    lastActivity: string;
  };
  
  members: Array<{
    userId: string;
    role: 'admin' | 'moderator' | 'member';
    joinedAt: string;
    isActive: boolean;
    invitedBy?: string;
    status: 'active' | 'pending' | 'suspended';
  }>;
};

export type AccountType = {
  id: string;
  name: string;
  balance: number;
  associationId: string;
};

export type IncomeType = {
  id: string;
  name: string;
  description?: string;
  associationId: string;
};

export type ExpenseType = {
  id: string;
  name: string;
  description?: string;
  associationId: string;
};

export type Transaction = {
  id: string;
  associationId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  createdBy: string;
  memberId?: string;
  accountTypeId?: string;
  incomeTypeId?: string;
  expenseTypeId?: string;
  fromAccountId?: string;
  toAccountId?: string;
};

export type JoinRequest = {
  id: string;
  userId: string;
  userName: string;
  associationId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
};
