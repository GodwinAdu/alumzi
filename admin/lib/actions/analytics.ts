'use server';


import { User, Association, Payment, Subscription } from '@/lib/models';
import { connectToDB } from '../mongoose';

export async function getDashboardStats() {
  await connectToDB();
  
  const [
    totalUsers,
    totalAssociations,
    activeUsers,
    totalRevenue,
    recentUsers,
    recentAssociations
  ] = await Promise.all([
    User.countDocuments(),
    Association.countDocuments(),
    User.countDocuments({ isActive: true }),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt').lean(),
    Association.find().sort({ createdAt: -1 }).limit(5).select('name createdAt').lean()
  ]);

  const subscriptionStats = await Subscription.aggregate([
    {
      $group: {
        _id: '$plan',
        count: { $sum: 1 },
        revenue: { $sum: '$amount' }
      }
    }
  ]);

  return {
    totalUsers,
    totalAssociations,
    activeUsers,
    totalRevenue: totalRevenue[0]?.total || 0,
    recentUsers: JSON.parse(JSON.stringify(recentUsers)),
    recentAssociations: JSON.parse(JSON.stringify(recentAssociations)),
    subscriptionStats: JSON.parse(JSON.stringify(subscriptionStats))
  };
}

export async function getRevenueAnalytics(period = '30d') {
  await connectToDB();
  
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const revenue = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  return JSON.parse(JSON.stringify(revenue));
}

export async function getUserGrowthAnalytics(period = '30d') {
  await connectToDB();
  
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const growth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  return JSON.parse(JSON.stringify(growth));
}