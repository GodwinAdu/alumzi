# Real-Time Features Analysis

## Overview
The application uses Socket.IO for real-time communication between the server and clients. This document analyzes the current implementation and identifies areas that need improvement.

## Current Implementation

### Backend (Server)
**Location**: `/server/src/sockets/index.ts`

#### Socket Events Emitted by Server:
1. **new_notification** - New notification for user
2. **financial_update** - Income/expense changes
3. **member_update** - Member joins, leaves, role changes
4. **dashboard_update** - Dashboard data changes
5. **settings_changed** - Association settings updates
6. **NEW_MESSAGE** - New chat message
7. **MESSAGE_DELETED** - Chat message deletion
8. **fundraiser_update** - Fundraiser changes
9. **payment_update** - Payment status changes
10. **user_joined** - User joins association
11. **user_left** - User leaves association
12. **user_offline** - User goes offline
13. **user_typing** - Typing indicators

#### Socket Events Listened by Server:
1. **join-association** - Join association room
2. **leave-association** - Leave association room
3. **JOIN_CHAT** - Join chat room (alternative)
4. **LEAVE_CHAT** - Leave chat room (alternative)
5. **typing_start** - User starts typing
6. **typing_stop** - User stops typing
7. **update_presence** - Update user presence

### Frontend

#### WebSocket Hook (`/frontend/hooks/useWebSocket.ts`)
- **Purpose**: Global WebSocket connection for notifications and updates
- **Listens to**:
  - `new_notification` → Invalidates notification queries
  - `financial_update` → Invalidates income, expense, dashboard queries
  - `member_update` → Invalidates member, dashboard queries
  - `dashboard_update` → Invalidates dashboard queries
  - `settings_changed` → Invalidates settings queries
  - `new_message` → Invalidates chat queries
  - `user_typing` → Handles typing indicators
  - `user_joined`, `user_left`, `user_offline` → User presence

- **Issues**:
  - ❌ Does NOT join association rooms
  - ❌ Only connects globally, not per-association
  - ✅ Properly invalidates React Query cache

#### SocketContext (`/frontend/contexts/SocketContext.tsx`)
- **Purpose**: Chat-specific WebSocket connection
- **Methods**:
  - `joinChatRoom(associationId)` → Emits `join-association`
  - `leaveChatRoom(associationId)` → Emits `leave-association`
- **Listens to**:
  - `NEW_MESSAGE` → Updates chat messages in cache
  - `MESSAGE_DELETED` → Removes deleted messages from cache

- **Issues**:
  - ✅ Properly joins association rooms for chat
  - ✅ Updates cache optimistically
  - ⚠️ Separate from useWebSocket (two connections)

## Problems Identified

### 1. **Dashboard Does NOT Join Association Room**
**File**: `/frontend/app/(association-tabs)/dashboard.tsx`
- ❌ Does NOT use `useWebSocket()` or join association room
- ❌ Will NOT receive real-time updates for:
  - Financial changes (income/expense)
  - Member updates
  - Dashboard updates
  - Settings changes

**Impact**: Dashboard data becomes stale until manual refresh

### 2. **Dual WebSocket Connections**
- `useWebSocket` hook creates one connection
- `SocketContext` creates another connection
- Both connect to the same server
- Inefficient and can cause sync issues

### 3. **Missing Association Room Joins**
Most pages that need real-time updates don't join association rooms:
- ❌ Dashboard
- ❌ Income page
- ❌ Expenses page
- ❌ Members page
- ❌ Settings page
- ❌ Reports page
- ✅ Chat page (only one that joins)

### 4. **No Typing Indicators in Chat**
- Backend supports typing events
- Frontend doesn't emit or handle them

## Recommendations

### Option 1: Unified WebSocket Hook (Recommended)
Merge `useWebSocket` and `SocketContext` into a single hook that:
1. Connects once globally
2. Provides `joinAssociation(id)` and `leaveAssociation(id)` methods
3. Handles all events (notifications, chat, updates)
4. Auto-joins association when user enters association tabs

### Option 2: Auto-Join on Association Selection
Modify `useWebSocket` to:
1. Watch `selectedAssociation` from AssociationContext
2. Auto-join association room when association is selected
3. Auto-leave when association changes or user logs out

### Option 3: Per-Page Room Joining
Each page that needs real-time updates should:
1. Use `useWebSocket()` hook
2. Call `socket.emit('join-association', associationId)` on mount
3. Call `socket.emit('leave-association', associationId)` on unmount

## Implementation Priority

### High Priority (Critical for UX)
1. ✅ **Dashboard real-time updates** - Users expect live financial data
2. ✅ **Member updates** - Show when members join/leave in real-time
3. ✅ **Financial updates** - Income/expense changes should reflect immediately

### Medium Priority (Nice to have)
4. **Settings updates** - Show when admins change settings
5. **Typing indicators** - Show when users are typing in chat
6. **User presence** - Show online/offline status

### Low Priority (Future enhancement)
7. **Fundraiser updates** - Real-time contribution updates
8. **Payment updates** - Real-time payment status
9. **Notification badges** - Real-time unread count updates

## Current Status

### ✅ Working
- Chat messages (real-time send/receive/delete)
- Notification invalidation (triggers refetch)
- WebSocket connection management
- Authentication with JWT

### ❌ Not Working
- Dashboard real-time updates (doesn't join room)
- Income/Expense real-time updates (doesn't join room)
- Members page real-time updates (doesn't join room)
- Settings real-time updates (doesn't join room)
- Typing indicators (not implemented)
- User presence indicators (not implemented)

### ⚠️ Partially Working
- Global notifications (works but not association-specific)
- Dual connections (works but inefficient)

## Next Steps

1. **Immediate Fix**: Add `useWebSocket()` to dashboard and join association room
2. **Short-term**: Implement Option 2 (auto-join on association selection)
3. **Long-term**: Refactor to Option 1 (unified WebSocket hook)
4. **Enhancement**: Add typing indicators and user presence

## Code Examples

### Current Dashboard (Missing Real-time)
```typescript
// ❌ No WebSocket connection
export default function DashboardPage() {
  const { selectedAssociation } = useAssociation();
  // ... no useWebSocket() call
  // ... no room joining
}
```

### Fixed Dashboard (With Real-time)
```typescript
// ✅ With WebSocket connection
export default function DashboardPage() {
  const { selectedAssociation } = useAssociation();
  const socket = useWebSocket();
  
  useEffect(() => {
    if (selectedAssociation?.id && socket) {
      socket.emit('join-association', selectedAssociation.id);
      return () => {
        socket.emit('leave-association', selectedAssociation.id);
      };
    }
  }, [selectedAssociation?.id, socket]);
}
```

## Conclusion

The real-time infrastructure is well-built on the backend, but the frontend is not fully utilizing it. The main issue is that most pages don't join association rooms, so they don't receive real-time updates. This can be fixed with minimal changes to add room joining logic to key pages.
