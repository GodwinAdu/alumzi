'use server';

import { Payment, User, Association } from '@/lib/models';
import { connectToDB } from '../mongoose';

export async function getPayments(page = 1, limit = 10, status = '') {
  await connectToDB();
  
  const query = status ? { status } : {};

  const payments = await Payment.find(query)
    // .populate('userId', 'name email')
    .populate('associationId', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await Payment.countDocuments(query);

  return {
    payments: JSON.parse(JSON.stringify(payments)),
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function getPaymentStats() {
  await connectToDB();
  
  const [
    totalPayments,
    completedPayments,
    pendingPayments,
    failedPayments,
    totalRevenue
  ] = await Promise.all([
    Payment.countDocuments(),
    Payment.countDocuments({ status: 'completed' }),
    Payment.countDocuments({ status: 'pending' }),
    Payment.countDocuments({ status: 'failed' }),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  return {
    totalPayments,
    completedPayments,
    pendingPayments,
    failedPayments,
    totalRevenue: totalRevenue[0]?.total || 0
  };
}

export async function refundPayment(paymentId: string) {
  await connectToDB();
  
  const payment = await Payment.findByIdAndUpdate(
    paymentId,
    { status: 'refunded' },
    { new: true }
  );

  return JSON.parse(JSON.stringify(payment));
}