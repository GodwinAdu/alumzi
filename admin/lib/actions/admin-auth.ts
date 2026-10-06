'use server';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminUser } from '@/lib/models/admin-user';
import { connectToDB } from '../mongoose';

export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
  role?: 'super_admin' | 'admin' | 'moderator';
}) {
  await connectToDB();
  
  const existingUser = await AdminUser.findOne({ email: data.email });
  if (existingUser) {
    throw new Error('Admin user already exists');
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  
  const permissions = getDefaultPermissions(data.role || 'admin');
  
  const adminUser = await AdminUser.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: data.role || 'admin',
    permissions
  });

  return {
    id: adminUser._id,
    name: adminUser.name,
    email: adminUser.email,
    role: adminUser.role
  };
}

export async function authenticateAdmin(email: string, password: string) {
  await  connectToDB();
  
  const adminUser = await AdminUser.findOne({ email, isActive: true });
  if (!adminUser) {
    throw new Error('Invalid credentials');
  }

  if (adminUser.lockUntil && adminUser.lockUntil > new Date()) {
    throw new Error('Account temporarily locked');
  }

  const isValidPassword = await bcrypt.compare(password, adminUser.password);
  if (!isValidPassword) {
    await AdminUser.findByIdAndUpdate(adminUser._id, {
      $inc: { loginAttempts: 1 },
      $set: { lockUntil: adminUser.loginAttempts >= 4 ? new Date(Date.now() + 30 * 60 * 1000) : undefined }
    });
    throw new Error('Invalid credentials');
  }

  await AdminUser.findByIdAndUpdate(adminUser._id, {
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });

  const token = jwt.sign(
    { 
      id: adminUser._id, 
      email: adminUser.email, 
      role: adminUser.role,
      permissions: adminUser.permissions
    },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      permissions: adminUser.permissions
    }
  };
}

function getDefaultPermissions(role: string): string[] {
  switch (role) {
    case 'super_admin':
      return [
        'users.read', 'users.write', 'users.delete',
        'associations.read', 'associations.write', 'associations.delete',
        'payments.read', 'payments.write', 'payments.refund',
        'analytics.read',
        'system.read', 'system.write',
        'platform.settings'
      ];
    case 'admin':
      return [
        'users.read', 'users.write',
        'associations.read', 'associations.write',
        'payments.read', 'payments.write',
        'analytics.read',
        'system.read'
      ];
    case 'moderator':
      return [
        'users.read',
        'associations.read',
        'payments.read',
        'analytics.read'
      ];
    default:
      return [];
  }
}