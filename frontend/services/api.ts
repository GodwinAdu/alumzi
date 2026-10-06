import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

const getBaseURL = () => {
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_API_URL_ANDROID || 'http://192.168.1.170:3001/api';
  } else {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
  }
};

const API_BASE_URL = getBaseURL();
const TOKEN_STORAGE_KEY = '@auth_token';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Associations
  async getAssociations() {
    return this.request('/associations');
  }

  async createAssociation(data: any) {
    return this.request('/associations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinAssociation(data: any) {
    return this.request('/associations/join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssociation(associationId: string, data: any) {
    return this.request(`/associations/${associationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Members
  async getMembers(associationId: string) {
    return this.request(`/members/${associationId}/members`);
  }

  async addMember(data: any) {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMember(memberId: string, updates: any) {
    console.log('Updating member:', memberId, 'with updates:', updates);
    return this.request(`/members/details/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMember(memberId: string) {
    return this.request(`/members/details/${memberId}`, {
      method: 'DELETE',
    });
  }

  async getMemberStatement(memberId: string) {
    return this.request(`/members/statement/${memberId}`);
  }

  async approveMember(associationId: string, memberId: string) {
    return this.request(`/associations/${associationId}/approve/${memberId}`, {
      method: 'POST',
    });
  }

  async rejectMember(associationId: string, memberId: string) {
    return this.request(`/associations/${associationId}/reject/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Transactions
  async getTransactions(associationId: string) {
    return this.request(`/associations/${associationId}/transactions`);
  }

  async addTransaction(data: any) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(transactionId: string) {
    return this.request(`/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  }

  // Countries
  async getCountries() {
    return this.request('/countries');
  }

  // Search
  async searchAssociationByCode(code: string) {
    return this.request(`/associations/search?query=${encodeURIComponent(code)}&searchType=code`);
  }

  async searchAssociationsByCountry(country: string, type?: string) {
    const params = new URLSearchParams({ query: country });
    if (type) params.append('type', type);
    return this.request(`/associations/search?${params.toString()}`);
  }

  // Invitations
  generateInviteLink(associationId: string) {
    // Return mock data since backend endpoint doesn't exist
    return Promise.resolve({ link: `https://app.example.com/join/${associationId}` });
  }

  // Notifications
  async getNotifications(page = 1, limit = 20) {
    console.log(`🔔 API: Requesting notifications from ${API_BASE_URL}/notifications?page=${page}&limit=${limit}`);
    return this.request(`/notifications?page=${page}&limit=${limit}`);
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PATCH',
    });
  }

  // Association Settings
  async getAssociationSettings(associationId: string) {
    return this.request(`/associations/${associationId}/settings`);
  }

  async updateAssociationSettings(associationId: string, settings: any) {
    return this.request(`/associations/${associationId}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  // Dashboard Data
  async getDashboardData(associationId: string) {
    return this.request(`/associations/${associationId}/dashboard`);
  }

  // Two-Factor Authentication
  async generate2FASetup() {
    return this.request('/2fa/setup');
  }

  async enable2FA(secret: string, token: string) {
    return this.request('/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ secret, token }),
    });
  }

  async disable2FA(token: string) {
    return this.request('/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async verify2FA(token: string) {
    return this.request('/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async get2FAStatus() {
    return this.request('/2fa/status');
  }

  async regenerateBackupCodes(token: string) {
    return this.request('/2fa/backup-codes', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async complete2FALogin(tempToken: string, token: string) {
    return this.request('/auth/2fa-login', {
      method: 'POST',
      body: JSON.stringify({ tempToken, token }),
    });
  }

  // Member Approval
  async getPendingRequests(associationId: string) {
    return this.request(`/associations/${associationId}/pending-requests`);
  }

  async approveMemberRequest(associationId: string, memberId: string) {
    return this.request(`/associations/${associationId}/approve/${memberId}`, {
      method: 'POST',
    });
  }

  async rejectMemberRequest(associationId: string, memberId: string) {
    return this.request(`/associations/${associationId}/reject/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Expense Types
  async getExpenseTypes(associationId: string) {
    return this.request(`/expense-types/${associationId}`);
  }

  async createExpenseType(associationId: string, data: { name: string; description?: string }) {
    return this.request(`/expense-types/${associationId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpenseType(associationId: string, expenseTypeId: string, data: any) {
    return this.request(`/expense-types/${associationId}/${expenseTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExpenseType(associationId: string, expenseTypeId: string) {
    return this.request(`/expense-types/${associationId}/${expenseTypeId}`, {
      method: 'DELETE',
    });
  }

  // Expenses
  async createExpense(data: {
    associationId: string;
    expenseTypeId: string;
    amount: number;
    description: string;
    vendor?: string;
    paymentMethod?: string;
  }) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getExpenses(associationId: string, page = 1, limit = 20) {
    return this.request(`/expenses/${associationId}?page=${page}&limit=${limit}`);
  }

  async updateExpense(expenseId: string, data: {
    expenseTypeId?: string;
    amount?: number;
    description?: string;
    vendor?: string;
    paymentMethod?: string;
  }) {
    return this.request(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async approveExpense(expenseId: string) {
    return this.request(`/expenses/${expenseId}/approve`, {
      method: 'PATCH',
    });
  }

  async deleteExpense(expenseId: string) {
    return this.request(`/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // Income Types
  async getIncomeTypes(associationId: string) {
    return this.request(`/income-types/${associationId}`);
  }

  async createIncomeType(associationId: string, data: { name: string; description?: string }) {
    console.log('Creating income type with data:', data, 'for association:', associationId);
    return this.request(`/income-types/${associationId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIncomeType(associationId: string, incomeTypeId: string, data: any) {
    return this.request(`/income-types/${associationId}/${incomeTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIncomeType(associationId: string, incomeTypeId: string) {
    return this.request(`/income-types/${associationId}/${incomeTypeId}`, {
      method: 'DELETE',
    });
  }

  // Incomes
  async createIncome(data: {
    associationId: string;
    incomeTypeId: string;
    amount: number;
    description: string;
    source?: string;
    sourceMember?: string;
    paymentMethod?: string;
    type?: string;
  }) {
    return this.request('/incomes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getIncomes(associationId: string, page = 1, limit = 20, cacheBust?: number) {
    const url = `/incomes/${associationId}?page=${page}&limit=${limit}${cacheBust ? `&_=${cacheBust}` : ''}`;
    return this.request(url);
  }

  async updateIncome(incomeId: string, data: {
    incomeTypeId?: string;
    amount?: number;
    description?: string;
    source?: string;
    sourceMember?: string;
    paymentMethod?: string;
    type?: string;
  }) {
    return this.request(`/incomes/${incomeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async approveIncome(incomeId: string) {
    return this.request(`/incomes/${incomeId}/approve`, {
      method: 'PATCH',
    });
  }

  async deleteIncome(incomeId: string) {
    return this.request(`/incomes/${incomeId}`, {
      method: 'DELETE',
    });
  }

  // Fundraisers
  async createFundraiser(associationId: string, data: {
    type: 'goal' | 'contribution';
    title: string;
    description: string;
    targetAmount?: number;
    deadline: string;
    createdBy: string;
  }) {
    return this.request(`/fundraisers/${associationId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getActiveFundraisers(associationId: string) {
    try {
      return this.request(`/fundraisers/${associationId}/active`);
    } catch (error) {
      // Return empty fundraisers if endpoint doesn't exist yet
      console.warn('Fundraisers endpoint not available, returning empty array');
      return { fundraisers: [] };
    }
  }

  async getFundraiser(fundraiserId: string) {
    return this.request(`/fundraisers/details/${fundraiserId}`);
  }

  async contributeFundraiser(fundraiserId: string, data: {
    amount: number;
    message?: string;
    contributorId: string;
  }) {
    return this.request(`/fundraisers/${fundraiserId}/contribute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFundraiser(fundraiserId: string, data: {
    title?: string;
    description?: string;
    targetAmount?: number;
    deadline?: string;
    status?: 'active' | 'completed' | 'expired';
  }) {
    return this.request(`/fundraisers/details/${fundraiserId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFundraiser(fundraiserId: string) {
    return this.request(`/fundraisers/details/${fundraiserId}`, {
      method: 'DELETE',
    });
  }

  // Member Dues
  async getMemberDues(associationId: string) {
    return this.request(`/associations/${associationId}/dues`);
  }

  async generateDues(associationId: string) {
    return this.request(`/associations/${associationId}/dues/generate`, {
      method: 'POST',
    });
  }

  async markDueAsPaid(dueId: string, data: {
    paidAmount?: number;
    paymentMethod?: string;
    notes?: string;
  }) {
    return this.request(`/associations/dues/${dueId}/mark-paid`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async payDue(associationId: string, memberId: string) {
    return this.request(`/associations/${associationId}/dues/${memberId}/pay`, {
      method: 'POST',
    });
  }

  async sendPaymentReminder(data: {
    memberId: string;
    paymentUrl: string;
    amount: number;
    dueDate: string;
  }) {
    return this.request('/associations/dues/send-reminder', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
export const api = apiService;