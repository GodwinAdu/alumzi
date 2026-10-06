'use server';

import { Association, Member, User, Income, Expense } from '@/lib/models';
import { connectToDB } from '../mongoose';

export async function getAssociations(page = 1, limit = 10, search = '', status = 'all', type = 'all') {
  await connectToDB();
  
  let query: any = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status !== 'all') {
    if (status === 'active') {
      query.status = 'approved';
      query.isActive = true;
    } else if (status === 'inactive') {
      query.$or = [
        { status: 'blocked' },
        { status: 'banned' },
        { isActive: false }
      ];
    } else {
      query.status = status;
    }
  }
  
  if (type !== 'all') {
    query.type = type;
  }

  const associations = await Association.find(query)
    .populate('createdBy', 'name email')
    .populate('moderatedBy', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Association.countDocuments(query);

  return {
    associations: JSON.parse(JSON.stringify(associations)),
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function getAssociationById(associationId: string) {
  await connectToDB();
  
  const association = await Association.findById(associationId)
    .populate('createdBy', 'name email phone')
    .populate('moderatedBy', 'name')
    .populate('members.userId', 'name email phone')
    .lean();
  if (!association) return null;

  const members = await Member.find({ associationId })
    .populate('userId', 'name email phone')
    .lean();

  const [totalIncome, totalExpenses, recentActivity] = await Promise.all([
    Income.aggregate([
      { $match: { associationId: associationId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Expense.aggregate([
      { $match: { associationId: associationId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Income.find({ associationId }).sort({ createdAt: -1 }).limit(5).lean()
  ]);

  return {
    association: JSON.parse(JSON.stringify(association)),
    members: JSON.parse(JSON.stringify(members)),
    stats: {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === 'active').length,
      totalIncome: totalIncome[0]?.total || 0,
      totalExpenses: totalExpenses[0]?.total || 0,
      balance: (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0)
    },
    recentActivity: JSON.parse(JSON.stringify(recentActivity))
  };
}

export async function moderateAssociation(associationId: string, status: string, reason?: string, moderatedBy?: string) {
  await connectToDB();
  
  const updateData: any = {
    status,
    moderatedAt: new Date(),
    isActive: status === 'approved'
  };
  
  if (reason) updateData.moderationReason = reason;
  if (moderatedBy) updateData.moderatedBy = moderatedBy;
  
  const association = await Association.findByIdAndUpdate(
    associationId,
    updateData,
    { new: true }
  );

  return JSON.parse(JSON.stringify(association));
}

export async function deleteAssociation(associationId: string) {
  await connectToDB();
  
  await Member.deleteMany({ associationId });
  await Income.deleteMany({ associationId });
  await Expense.deleteMany({ associationId });
  await Association.findByIdAndDelete(associationId);
  
  return { success: true };
}

export async function getAssociationStats() {
  await connectToDB();
  
  const [totalAssociations, activeAssociations, pendingAssociations, blockedAssociations, totalMembers, totalRevenue] = await Promise.all([
    Association.countDocuments(),
    Association.countDocuments({ status: 'approved', isActive: true }),
    Association.countDocuments({ status: 'pending' }),
    Association.countDocuments({ status: { $in: ['blocked', 'banned'] } }),
    Member.countDocuments(),
    Association.aggregate([
      { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
    ])
  ]);
  
  return {
    totalAssociations,
    activeAssociations,
    pendingAssociations,
    blockedAssociations,
    totalMembers,
    totalRevenue: totalRevenue[0]?.total || 0
  };
}

export async function bulkUpdateAssociations(associationIds: string[], updates: any) {
  await connectToDB();
  
  await Association.updateMany(
    { _id: { $in: associationIds } },
    updates
  );
  
  return { success: true };
}

export async function updateAssociationSettings(associationId: string, settings: any) {
  await connectToDB();
  
  const association = await Association.findByIdAndUpdate(
    associationId,
    { $set: { settings } },
    { new: true }
  );
  
  return JSON.parse(JSON.stringify(association));
}

export async function updateAssociationInfo(associationId: string, data: any) {
  await connectToDB();
  
  const association = await Association.findByIdAndUpdate(
    associationId,
    { $set: data },
    { new: true }
  );
  
  return JSON.parse(JSON.stringify(association));
}

export async function getAssociationMembers(associationId: string, page = 1, limit = 10) {
  await connectToDB();
  
  const members = await Member.find({ associationId })
    .populate('userId', 'name email phone')
    .sort({ joinedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
    
  const total = await Member.countDocuments({ associationId });
  
  return {
    members: JSON.parse(JSON.stringify(members)),
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function updateMemberStatus(memberId: string, status: string) {
  await connectToDB();
  
  const member = await Member.findByIdAndUpdate(
    memberId,
    { status },
    { new: true }
  ).populate('userId', 'name email');
  
  return JSON.parse(JSON.stringify(member));
}