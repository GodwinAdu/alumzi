# WhatsApp-Style Group Join Request System

## 🎯 Overview
Implemented a complete WhatsApp-style group join request system where members can request to join groups and admins can approve/reject requests.

## 🔑 Key Concepts

### Dual Role System
- **Association Role**: User's role in the association (admin, moderator, member)
- **Group Role**: User's role in specific groups (admin, member)
- These are independent - an association member can be a group admin

### Group Privacy Settings
- **Public Groups**: Anyone can join instantly (no approval needed)
- **Private Groups**: Requires admin approval to join

## 📦 Backend Changes

### New Model: GroupJoinRequest
**File**: `/server/src/models/groupJoinRequest.models.ts`
```typescript
{
  groupId: ObjectId,
  userId: ObjectId,
  status: 'pending' | 'approved' | 'rejected',
  requestedAt: Date,
  processedAt?: Date,
  processedBy?: ObjectId
}
```

### Updated Group Model
**File**: `/server/src/models/group.models.ts`
- Added `isPublic` setting (default: true)
- Added `requireApproval` setting (default: false)

### New API Endpoints
**File**: `/server/src/routes/group.routes.ts`

1. **POST** `/groups/:groupId/join`
   - Join public group instantly OR create join request for private groups
   - Returns `{ requiresApproval: boolean }`

2. **GET** `/groups/:groupId/join-requests`
   - Get pending join requests (admin only)
   - Returns list of users requesting to join

3. **POST** `/groups/join-requests/:requestId/approve`
   - Approve a join request (admin only)
   - Adds user to group

4. **POST** `/groups/join-requests/:requestId/reject`
   - Reject a join request (admin only)

### Controller Functions
**File**: `/server/src/controllers/group.controller.ts`

- `joinGroup()` - Smart join (instant or request based on settings)
- `getGroupJoinRequests()` - List pending requests
- `approveJoinRequest()` - Approve and add member
- `rejectJoinRequest()` - Reject request

## 📱 Frontend Changes

### Updated API Client
**File**: `/frontend/lib/api.ts`
```typescript
api.joinGroup(groupId)
api.getGroupJoinRequests(groupId)
api.approveJoinRequest(requestId)
api.rejectJoinRequest(requestId)
```

### New Screen: Group Join Requests
**File**: `/frontend/app/group-join-requests.tsx`
- Shows pending join requests for group admins
- Approve/Reject buttons with confirmation
- Real-time updates via React Query

### Updated Screens

#### Community Groups Screen
**File**: `/frontend/app/community-groups.tsx`
- Shows "Request" button for private groups
- Shows "Join" button for public groups
- Shows "Requests" button for group admins
- Displays approval status after requesting

#### Group Settings Screen
**File**: `/frontend/app/group-settings.tsx`
- Added "Privacy & Join Settings" section
- Toggle for "Public Group"
- Toggle for "Require Approval"

## 🔄 User Flow

### Joining a Public Group
1. User clicks "Join" on group card
2. Instantly added to group
3. Can immediately access group chat

### Joining a Private Group
1. User clicks "Request" on group card
2. Join request created with status "pending"
3. User sees "Join request sent" message
4. Admin receives notification (future enhancement)

### Admin Approving Requests
1. Admin sees "Requests" button on group card
2. Clicks to view pending requests
3. Reviews user information
4. Clicks "Approve" or "Reject"
5. User is added to group (if approved)
6. Request status updated

## 🎨 UI Features

### Group Card Indicators
- **Public groups**: Show "Join" button
- **Private groups**: Show "Request" button
- **Member view**: Show chat icon
- **Admin view**: Show "Requests" button + chat icon

### Join Request Card
- User avatar (emoji or first letter)
- User name and contact info
- Request date
- Approve (green) and Reject (red) buttons
- Loading states during processing

## 🔐 Permissions

### Who Can Join Groups?
- Must be a member of the association
- Public groups: Anyone can join
- Private groups: Must be approved by admin

### Who Can Approve Requests?
- Only group admins
- Association admins are NOT automatically group admins

### Who Can See Join Requests?
- Only group admins
- Returns 403 error for non-admins

## 📊 Database Indexes
```typescript
// Efficient queries
{ groupId: 1, userId: 1 } // Unique constraint
{ groupId: 1, status: 1 }  // Filter pending requests
```

## 🚀 Future Enhancements

1. **Push Notifications**
   - Notify admins of new join requests
   - Notify users when request is approved/rejected

2. **Bulk Actions**
   - Approve/reject multiple requests at once

3. **Request Messages**
   - Allow users to add a message with their request
   - "Why do you want to join?"

4. **Auto-Expire Requests**
   - Automatically reject requests after X days

5. **Invite Links**
   - Generate shareable invite links
   - Bypass approval for invited users

6. **Request History**
   - View approved/rejected requests
   - Analytics on join patterns

## 🧪 Testing Checklist

- [ ] Public group: Join instantly
- [ ] Private group: Create join request
- [ ] Admin: View pending requests
- [ ] Admin: Approve request → User added
- [ ] Admin: Reject request → User not added
- [ ] Non-admin: Cannot view requests (403)
- [ ] Duplicate request: Show error
- [ ] Already member: Show error
- [ ] Non-association member: Cannot request (403)

## 📝 Notes

- Group roles are independent of association roles
- Default groups (Announcements, General) cannot be left
- Join requests are unique per user per group
- Approved requests add user with "member" role
- Rejected requests remain in database for history
