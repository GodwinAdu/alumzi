import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Configuration
const getBaseURL = () => {
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_API_URL_ANDROID || 'http://192.168.1.170:3001/api';
  } else {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
  }
};

const API_BASE_URL = getBaseURL();

// API Client
class ApiClient {
  private _baseURL: string;


  constructor(baseURL: string) {
    this._baseURL = baseURL;
  }

  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('@auth_token');
    console.log('🔑 Auth token:', token ? 'Present' : 'Missing');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this._baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    console.log('🌐 API Request:', {
      url,
      method: options.method || 'GET',
      body: options.body,
      hasAuth: headers.Authorization ? 'Yes' : 'No'
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      console.log('📡 API Response:', {
        url,
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        console.log('❌ API Error Response:', error);

        // If token is invalid/expired, clear stored auth data
        if (response.status === 403 && error.message?.includes('token')) {
          console.log('🔄 Token expired, clearing auth data...');
          await AsyncStorage.removeItem('@auth_token');
          await AsyncStorage.removeItem('@auth_user');
        }

        // Provide user-friendly error messages
        let userMessage = error.message;

      switch (response.status) {
        case 400:
          if (error.message?.includes('validation')) {
            userMessage = 'Please check your input and try again';
          } else if (error.message?.includes('required')) {
            userMessage = 'Please fill in all required fields';
          } else if (error.message?.includes('invalid')) {
            userMessage = 'The information provided is invalid';
          } else {
            userMessage = error.message || 'Invalid request. Please check your input';
          }
          break;

        case 401:
          userMessage = 'Please sign in to continue';
          break;

        case 403:
          if (error.message?.includes('authorized') || error.message?.includes('permission')) {
            userMessage = 'You do not have permission to perform this action';
          } else if (error.message?.includes('token') || error.message?.includes('expired')) {
            userMessage = 'Your session has expired. Please sign in again';
          } else {
            userMessage = 'Access denied';
          }
          break;

        case 404:
          if (error.message?.includes('user')) {
            userMessage = 'User not found';
          } else if (error.message?.includes('association')) {
            userMessage = 'Association not found';
          } else if (error.message?.includes('member')) {
            userMessage = 'Member not found';
          } else {
            userMessage = 'The requested information was not found';
          }
          break;

        case 409:
          if (error.message?.includes('exists')) {
            userMessage = 'This item already exists';
          } else if (error.message?.includes('duplicate')) {
            userMessage = 'Duplicate entry detected';
          } else {
            userMessage = error.message || 'Conflict detected';
          }
          break;

        case 422:
          userMessage = 'Please check your input and try again';
          break;

        case 429:
          userMessage = 'Too many requests. Please wait a moment and try again';
          break;

        case 500:
          userMessage = 'Something went wrong on our end. Please try again later';
          break;

        case 502:
        case 503:
        case 504:
          userMessage = 'Service temporarily unavailable. Please try again later';
          break;

        default:
          if (response.status >= 500) {
            userMessage = 'Server error. Please try again later';
          } else if (response.status >= 400) {
            userMessage = error.message || 'Request failed. Please try again';
          } else {
            userMessage = error.message || `HTTP ${response.status}`;
          }
      }

      throw new Error(userMessage);
    }

    return response.json();
    } catch (error: any) {
      console.error('❌ API Request Failed:', error);
      throw error;
    }
  }



  // Auth endpoints
  async sendOTP(identifier: string, channel: 'email' | 'phone', isSignUp?: boolean) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, channel, isSignUp }),
    });
  }

  async signIn(identifier: string, otp: string) {
    const deviceId = await AsyncStorage.getItem('deviceId') || `device-${Date.now()}`;
    await AsyncStorage.setItem('deviceId', deviceId);

    return this.request('/auth/sign-in', {
      method: 'POST',
      headers: {
        'X-Device-Id': deviceId,
        'X-Device-Name': 'Alumzi Mobile App',
      },
      body: JSON.stringify({ identifier, otp }),
    });
  }

  async signUp(name: string, email: string, phoneNumber: string, otp: string) {
    const deviceId = await AsyncStorage.getItem('deviceId') || `device-${Date.now()}`;
    await AsyncStorage.setItem('deviceId', deviceId);

    return this.request('/auth/sign-up', {
      method: 'POST',
      headers: {
        'X-Device-Id': deviceId,
        'X-Device-Name': 'Alumzi Mobile App',
      },
      body: JSON.stringify({ name, email, phoneNumber, otp }),
    });
  }

  // Associations


  // async createAssociation(data: any) {
  //   return this.request('/associations', {
  //     method: 'POST',
  //     body: JSON.stringify(data),
  //   });
  // }

  // async joinAssociation(data: any) {
  //   return this.request('/associations/join', {
  //     method: 'POST',
  //     body: JSON.stringify(data),
  //   });
  // }

  // Members
  async getMembers(associationId: string) {
    return this.request(`/associations/${associationId}/members`);
  }

  async addMember(data: any) {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMember(memberId: string, updates: any) {
    return this.request(`/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMember(memberId: string) {
    return this.request(`/members/${memberId}`, {
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
    return this.request(`/associations/search?code=${code}`);
  }

  async searchAssociationsByCountry(country: string, type?: string) {
    const params = new URLSearchParams({ country });
    if (type) params.append('type', type);
    return this.request(`/associations/search?${params.toString()}`);
  }

  // Invitations
  async getContacts() {
    return this.request('/users/contacts');
  }

  async inviteContacts(associationId: string, contactIds: string[]) {
    return this.request('/associations/invite', {
      method: 'POST',
      body: JSON.stringify({ associationId, contactIds }),
    });
  }

  async generateInviteLink(associationId: string) {
    return this.request(`/associations/${associationId}/invite-link`, {
      method: 'POST',
    });
  }

  // Notifications
  async getNotifications(page = 1, limit = 20) {
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

  // Association endpoints
  async createAssociation(data: any) {
    return this.request('/associations/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  async getAssociations() {
    return this.request('/associations');
  }

  async joinAssociation(code: string) {
    return this.request('/associations/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async getUserAssociations() {
    return this.request('/associations/my-associations');
  }

  async searchAssociations(query: string, type?: string) {
    const params = new URLSearchParams({ query });
    if (type) params.append('type', type);
    return this.request(`/associations/search?${params}`);
  }

  // Member endpoints
  async addMembers(associationId: string, members: any[], guestMembers?: any[]) {
    return this.request('/members/add-members', {
      method: 'POST',
      body: JSON.stringify({ associationId, members, guestMembers }),
    });
  }

  async getAssociationMembers(associationId: string) {
    return this.request(`/associations/${associationId}/members`);
  }

  async checkExistingMembers(associationId: string, contacts: any[]) {
    return this.request('/members/check-existing', {
      method: 'POST',
      body: JSON.stringify({ associationId, contacts }),
    });
  }

  // Chat endpoints
  async getDefaultChat(associationId: string) {
    return this.request(`/chat/default/${associationId}`);
  }

  async createDirectChat(associationId: string, participantId: string) {
    return this.request('/chat/direct', {
      method: 'POST',
      body: JSON.stringify({ associationId, participantId }),
    });
  }

  async getAssociationChats(associationId: string) {
    return this.request(`/chat/association/${associationId}`);
  }

  async sendMessage(chatId: string, content: string, messageType = 'text', replyTo?: string) {
    return this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ chatId, content, messageType, replyTo }),
    });
  }

  async getChatMessages(chatId: string, page = 1, limit = 50) {
    return this.request(`/chat/${chatId}/messages?page=${page}&limit=${limit}`);
  }

  async markMessageAsRead(messageId: string) {
    return this.request(`/chat/message/${messageId}/read`, {
      method: 'PUT',
    });
  }

  async getMemberDetails(memberId: string) {
    return this.request(`/members/details/${memberId}`);
  }

  async updateMemberDetails(memberId: string, updates: any) {
    return this.request(`/members/details/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getAssociationDetails(associationId: string) {
    return this.request(`/associations/${associationId}`);
  }

  async updateAssociation(associationId: string, updates: any) {
    return this.request(`/associations/${associationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAssociation(associationId: string) {
    return this.request(`/associations/${associationId}`, {
      method: 'DELETE',
    });
  }

  // Subscription endpoints
  async getSubscription(associationId: string) {
    return this.request(`/subscriptions/${associationId}`);
  }

  async upgradePlan(associationId: string, plan: string) {
    return this.request(`/subscriptions/${associationId}/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  async confirmUpgrade(reference: string) {
    return this.request('/subscriptions/confirm-upgrade', {
      method: 'POST',
      body: JSON.stringify({ reference }),
    });
  }

  async verifyDuesPayment(reference: string) {
    return this.request(`/associations/dues/verify/${reference}`);
  }

  async getMemberDuesDetails(memberId: string) {
    return this.request(`/associations/dues/member/${memberId}`);
  }

  async sendDuesPaymentReminder(associationId: string, memberId: string) {
    return this.request(`/associations/${associationId}/dues/${memberId}/remind`, {
      method: 'POST',
    });
  }

  // Payment Account endpoints
  async getPaymentAccount(associationId: string) {
    return this.request(`/payment-accounts/${associationId}`);
  }

  async createPaymentAccount(associationId: string, data: {
    accountType: 'bank' | 'momo';
    accountNumber: string;
    accountName: string;
    bankCode?: string;
    bankName?: string;
    momoProvider?: 'mtn' | 'vodafone' | 'airtel';
  }) {
    return this.request(`/payment-accounts/${associationId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePaymentAccount(associationId: string, accountId: string, updates: any) {
    return this.request(`/payment-accounts/${associationId}/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Payment endpoints
  async initiatePayment(data: {
    associationId: string;
    amount: number;
    purpose: string;
    description: string;
    fundraiserId?: string;
  }) {
    return this.request('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyPayment(reference: string) {
    return this.request(`/payments/verify/${reference}`);
  }

  async getPaymentHistory(associationId: string) {
    return this.request(`/payments/history/${associationId}`);
  }

  // Expense endpoints
  async getExpenses(associationId: string, groupId?: string) {
    const params = groupId ? `?groupId=${groupId}` : '';
    return this.request(`/expenses/${associationId}${params}`);
  }

  async createExpense(data: any) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpense(expenseId: string, updates: any) {
    return this.request(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteExpense(expenseId: string) {
    return this.request(`/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // Income endpoints
  async getIncomes(associationId: string, groupId?: string) {
    const params = groupId ? `?groupId=${groupId}` : '';
    return this.request(`/incomes/${associationId}${params}`);
  }

  async createIncome(data: any) {
    return this.request('/incomes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIncome(incomeId: string, updates: any) {
    return this.request(`/incomes/${incomeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteIncome(incomeId: string) {
    return this.request(`/incomes/${incomeId}`, {
      method: 'DELETE',
    });
  }

  // Expense Types
  async getExpenseTypes(associationId: string) {
    return this.request(`/expense-types/${associationId}`);
  }

  async createExpenseType(data: any) {
    return this.request('/expense-types', {
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

  // Income Types
  async getIncomeTypes(associationId: string) {
    return this.request(`/income-types/${associationId}`);
  }

  async createIncomeType(data: any) {
    return this.request('/income-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard endpoints
  async getDashboardData(associationId: string) {
    return this.request(`/associations/${associationId}/dashboard`);
  }

  async getMemberStatement(memberId: string) {
    return this.request(`/members/statement/${memberId}`);
  }

  // Banks endpoints
  async getBanks() {
    return this.request('/payment-accounts/banks');
  }

  async verifyAccountNumber(accountNumber: string, bankCode: string) {
    return this.request('/payment-accounts/verify-account', {
      method: 'POST',
      body: JSON.stringify({ accountNumber, bankCode }),
    });
  }

  // Settlements endpoints
  async getSettlements(associationId: string) {
    return this.request(`/settlements/${associationId}`);
  }



  // Two-Factor Authentication
  async get2FAStatus() {
    return this.request('/2fa/status');
  }

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

  async updateProfile(updates: { name?: string; email?: string; country?: string }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Fundraiser payment endpoints
  async initiateFundraiserPayment(data: {
    fundraiserId: string;
    amount: number;
  }) {
    return this.request('/payments/fundraiser/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyFundraiserPayment(reference: string) {
    return this.request(`/payments/fundraiser/verify/${reference}`);
  }

  // Group endpoints
  async getCommunityGroups(communityId: string) {
    return this.request(`/groups/community/${communityId}`);
  }

  async joinGroup(groupId: string) {
    return this.request(`/groups/${groupId}/join`, {
      method: 'POST',
    });
  }

  async getGroupJoinRequests(groupId: string) {
    return this.request(`/groups/${groupId}/join-requests`);
  }

  async approveJoinRequest(requestId: string) {
    return this.request(`/groups/join-requests/${requestId}/approve`, {
      method: 'POST',
    });
  }

  async rejectJoinRequest(requestId: string) {
    return this.request(`/groups/join-requests/${requestId}/reject`, {
      method: 'POST',
    });
  }

  async leaveGroup(groupId: string) {
    return this.request(`/groups/${groupId}/leave`, {
      method: 'POST',
    });
  }

  async createGroup(data: { communityId: string; name: string; description?: string; icon?: string }) {
    return this.request('/groups/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGroupMembers(groupId: string) {
    return this.request(`/groups/${groupId}/members`);
  }

  async getGroupFinancialSummary(groupId: string) {
    return this.request(`/groups/${groupId}/financial-summary`);
  }

  async getConsolidatedFinances(communityId: string) {
    return this.request(`/groups/community/${communityId}/consolidated-finances`);
  }

  async getGroupSettings(groupId: string) {
    return this.request(`/groups/${groupId}/settings`);
  }

  async updateGroupSettings(groupId: string, settings: any) {
    return this.request(`/groups/${groupId}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  async updateGroupInfo(groupId: string, data: { name?: string; description?: string; avatar?: string; banner?: string }) {
    return this.request(`/groups/${groupId}/info`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addGroupMembers(groupId: string, memberIds: string[]) {
    return this.request(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ memberIds }),
    });
  }

  async removeGroupMember(groupId: string, memberId: string) {
    return this.request(`/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  async promoteToAdmin(groupId: string, memberId: string) {
    return this.request(`/groups/${groupId}/members/${memberId}/promote`, {
      method: 'PUT',
    });
  }

  async demoteFromAdmin(groupId: string, memberId: string) {
    return this.request(`/groups/${groupId}/members/${memberId}/demote`, {
      method: 'PUT',
    });
  }

  async createEvent(groupId: string, data: { title: string; description?: string; location?: string; startDate: string; endDate?: string }) {
    return this.request(`/groups/${groupId}/events`, {
      method: 'POST',
      body: JSON.stringify({ groupId, ...data }),
    });
  }

  async getGroupEvents(groupId: string) {
    return this.request(`/groups/${groupId}/events`);
  }

  async respondToEvent(eventId: string, status: 'going' | 'maybe' | 'not_going') {
    return this.request(`/groups/events/${eventId}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteEvent(eventId: string) {
    return this.request(`/groups/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async createPoll(groupId: string, data: { question: string; options: string[]; expiresAt?: string; allowMultiple?: boolean }) {
    return this.request(`/groups/${groupId}/polls`, {
      method: 'POST',
      body: JSON.stringify({ groupId, ...data }),
    });
  }

  async getGroupPolls(groupId: string) {
    return this.request(`/groups/${groupId}/polls`);
  }

  async votePoll(pollId: string, optionIndex: number) {
    return this.request(`/groups/polls/${pollId}/vote`, {
      method: 'PUT',
      body: JSON.stringify({ optionIndex }),
    });
  }

  async closePoll(pollId: string) {
    return this.request(`/groups/polls/${pollId}/close`, {
      method: 'PUT',
    });
  }

  async createAnnouncement(groupId: string, data: { title: string; content: string; isPinned?: boolean }) {
    return this.request(`/groups/${groupId}/announcements`, {
      method: 'POST',
      body: JSON.stringify({ groupId, ...data }),
    });
  }

  async getGroupAnnouncements(groupId: string) {
    return this.request(`/groups/${groupId}/announcements`);
  }

  async deleteAnnouncement(announcementId: string) {
    return this.request(`/groups/announcements/${announcementId}`, {
      method: 'DELETE',
    });
  }

  async pinMessage(messageId: string) {
    return this.request(`/groups/messages/${messageId}/pin`, {
      method: 'PUT',
    });
  }

  async unpinMessage(messageId: string) {
    return this.request(`/groups/messages/${messageId}/unpin`, {
      method: 'PUT',
    });
  }

  async getPinnedMessages(groupId: string) {
    return this.request(`/groups/${groupId}/pinned-messages`);
  }

  // Chat endpoints for association chat
  async get(endpoint: string) {
    return this.request(endpoint);
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // User Profile endpoints
  async updateUserProfile(data: { name?: string; bio?: string; avatar?: string }) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserProfile(userId: string) {
    return this.request(`/users/profile/${userId}`);
  }

  async updateOnlineStatus(isOnline: boolean) {
    return this.request('/users/status', {
      method: 'PUT',
      body: JSON.stringify({ isOnline }),
    });
  }

  async globalSearch(query: string) {
    return this.request(`/users/search?query=${encodeURIComponent(query)}`);
  }

  // Message Features endpoints
  async addReaction(messageId: string, emoji: string) {
    return this.request(`/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  async removeReaction(messageId: string, emoji: string) {
    return this.request(`/messages/${messageId}/reactions`, {
      method: 'DELETE',
      body: JSON.stringify({ emoji }),
    });
  }

  async getMessageReactions(messageId: string) {
    return this.request(`/messages/${messageId}/reactions`);
  }

  async bookmarkMessage(messageId: string, groupId: string, note?: string) {
    return this.request(`/messages/${messageId}/bookmark`, {
      method: 'POST',
      body: JSON.stringify({ groupId, note }),
    });
  }

  async removeBookmark(messageId: string) {
    return this.request(`/messages/${messageId}/bookmark`, {
      method: 'DELETE',
    });
  }

  async getUserBookmarks() {
    return this.request('/bookmarks');
  }

  async markMessageAsReadReceipt(messageId: string) {
    return this.request(`/messages/${messageId}/read`, {
      method: 'POST',
    });
  }

  async getMessageReadReceipts(messageId: string) {
    return this.request(`/messages/${messageId}/reads`);
  }

  // Phase 1 Message Features
  async editMessage(messageId: string, text: string) {
    return this.request(`/groups/messages/${messageId}/edit`, {
      method: 'PUT',
      body: JSON.stringify({ text }),
    });
  }

  async starMessage(messageId: string) {
    return this.request(`/groups/messages/${messageId}/star`, {
      method: 'PUT',
    });
  }

  async unstarMessage(messageId: string) {
    return this.request(`/groups/messages/${messageId}/star`, {
      method: 'DELETE',
    });
  }

  async getStarredMessages() {
    return this.request('/groups/starred-messages');
  }

  async forwardMessage(messageId: string, groupId: string) {
    return this.request(`/groups/messages/${messageId}/forward`, {
      method: 'POST',
      body: JSON.stringify({ groupId }),
    });
  }

  async checkRegisteredContacts(data: { phoneNumbers: string[]; emails: string[] }) {
    return this.request('/users/check-registered', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Helper method to get token for external use
  async getToken() {
    return await AsyncStorage.getItem('@auth_token');
  }

  // Dues Payment endpoints
  async getMemberDuesStatus(groupId: string) {
    return this.request(`/dues/member/${groupId}`);
  }

  async initializeDuesPayment(groupId: string, paymentIds: string[]) {
    return this.request('/dues/initialize', {
      method: 'POST',
      body: JSON.stringify({ groupId, paymentIds }),
    });
  }

  async getGroupDuesStatus(groupId: string) {
    return this.request(`/dues/group/${groupId}`);
  }

  async generateDues(groupId: string, period: string) {
    return this.request(`/dues/generate/${groupId}`, {
      method: 'POST',
      body: JSON.stringify({ period }),
    });
  }

  async markDuesPaymentPaid(paymentId: string, paymentMethod?: string, notes?: string) {
    return this.request(`/dues/mark-paid/${paymentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentMethod, notes }),
    });
  }

  async getMemberDuesForAdmin(groupId: string, memberId: string) {
    return this.request(`/dues/admin/${groupId}/${memberId}`);
  }

  async markMemberDuesPaid(paymentIds: string[], paidAmount: number, notes?: string) {
    return this.request('/dues/mark-paid', {
      method: 'POST',
      body: JSON.stringify({ paymentIds, paidAmount, notes }),
    });
  }

  // Expose baseURL for external use
  get baseURL() {
    return this._baseURL;
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
