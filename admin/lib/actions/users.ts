'use server';

import { User, Association, Member } from '@/lib/models';
import { connectToDB } from '../mongoose';

export async function getUsers(page = 1, limit = 10, search = '', status = 'all', verified = 'all') {
  await connectToDB();
  
  let query: any = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status !== 'all') {
    query.isActive = status === 'active';
  }
  
  if (verified !== 'all') {
    query.isVerified = verified === 'verified';
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await User.countDocuments(query);

  return {
    users: JSON.parse(JSON.stringify(users)),
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function getUserStats() {
  await connectToDB();
  
  const [totalUsers, activeUsers, verifiedUsers, newUsersThisMonth] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ 
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } 
    })
  ]);
  
  return { totalUsers, activeUsers, verifiedUsers, newUsersThisMonth };
}

export async function bulkUpdateUsers(userIds: string[], updates: any) {
  await connectToDB();
  
  await User.updateMany(
    { _id: { $in: userIds } },
    updates
  );
  
  return { success: true };
}

export async function getUserById(userId: string) {
  await connectToDB();
  
  const user = await User.findById(userId)
    .select('-password')
    .lean();

  if (!user) return null;

  const memberships = await Member.find({ userId })
    .populate('associationId', 'name')
    .lean();

  return {
    user: JSON.parse(JSON.stringify(user)),
    memberships: JSON.parse(JSON.stringify(memberships))
  };
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  await connectToDB();
  
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive },
    { new: true }
  ).select('-password');

  return JSON.parse(JSON.stringify(user));
}

export async function deleteUser(userId: string) {
  await connectToDB();
  
  await Member.deleteMany({ userId });
  await User.findByIdAndDelete(userId);
  
  return { success: true };
}

export async function exportUsers(filters: any = {}) {
  await connectToDB();
  
  const users = await User.find(filters)
    .select('-password')
    .lean();
    
  return JSON.parse(JSON.stringify(users));
}