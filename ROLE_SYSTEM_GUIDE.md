# Alumzi Role System Guide

## 🎭 Dual Role Architecture

Alumzi uses a **dual role system** where users have TWO separate roles:

### 1️⃣ Association Role (Community-Level)
**Location**: Association.members[].role  
**Scope**: Entire association/community  
**Values**: `admin` | `moderator` | `member`

### 2️⃣ Group Role (Group-Level)
**Location**: GroupMember.role  
**Scope**: Individual group within association  
**Values**: `admin` | `member`

---

## 🔑 Key Principle

> **Association roles and group roles are INDEPENDENT**

- An association **member** can be a group **admin**
- An association **admin** can be a group **member**
- They don't automatically inherit each other

---

## 📊 Role Comparison

| Feature | Association Role | Group Role |
|---------|-----------------|------------|
| **Scope** | Entire community | Single group |
| **Set When** | Join association | Join group |
| **Levels** | admin/moderator/member | admin/member |
| **Controls** | Association settings, create groups | Group settings, manage members |
| **Inherited?** | No | No |

---

## 🎯 Association Roles

### Admin
**Permissions:**
- ✅ Create/edit/delete association
- ✅ Manage all members (add/remove/change roles)
- ✅ Create groups
- ✅ Access all financial data
- ✅ Manage association settings
- ✅ View all groups
- ❌ NOT automatically admin of all groups

**Use Case:** School principal, community founder

### Moderator
**Permissions:**
- ✅ Create groups
- ✅ Add members to association
- ✅ View financial data
- ✅ Manage pending join requests
- ❌ Cannot change association settings
- ❌ Cannot remove admins

**Use Case:** Class representative, committee member

### Member
**Permissions:**
- ✅ View association info
- ✅ Join public groups
- ✅ Request to join private groups
- ✅ View own financial data
- ❌ Cannot create groups
- ❌ Cannot add members

**Use Case:** Regular alumni, community member

---

## 👥 Group Roles

### Group Admin
**Permissions:**
- ✅ Manage group settings (privacy, posting rules)
- ✅ Add/remove group members
- ✅ Promote/demote members
- ✅ Approve/reject join requests
- ✅ Delete messages
- ✅ Pin/unpin messages
- ✅ Create events, polls, announcements
- ✅ Manage group finances

**How to Become:**
- Auto-assigned when creating a group
- Promoted by another group admin
- Multiple admins allowed per group

### Group Member
**Permissions:**
- ✅ Send messages (if allowed by settings)
- ✅ View group content
- ✅ Participate in polls
- ✅ RSVP to events
- ✅ Leave group (except default groups)
- ❌ Cannot change settings
- ❌ Cannot manage members

---

## 🔄 Real-World Examples

### Example 1: School Alumni Association
```
User: John Doe
├─ Association Role: member (regular alumni)
└─ Group Roles:
   ├─ "Class of 2020" → admin (class representative)
   ├─ "Sports Team" → member (participant)
   └─ "Fundraising" → admin (committee lead)
```

**What John Can Do:**
- ❌ Cannot create new groups (needs moderator+ role)
- ✅ Can manage "Class of 2020" group (group admin)
- ✅ Can approve join requests for "Class of 2020"
- ❌ Cannot manage "Sports Team" (only member there)

### Example 2: Community Organization
```
User: Jane Smith
├─ Association Role: admin (founder)
└─ Group Roles:
   ├─ "Announcements" → member (auto-joined)
   ├─ "Finance Committee" → admin (committee chair)
   └─ "Events Team" → member (participant)
```

**What Jane Can Do:**
- ✅ Can create new groups (association admin)
- ✅ Can manage association settings
- ✅ Can manage "Finance Committee" (group admin)
- ❌ Cannot manage "Events Team" settings (only member)
- ✅ Can remove herself from "Events Team"

---

## 🛠️ How Roles Are Assigned

### Association Roles

**On Association Creation:**
```typescript
creator → admin (automatic)
```

**When Joining:**
```typescript
new member → member (default)
admin can promote → moderator or admin
```

**Changing Roles:**
```typescript
// Only association admins can change roles
PUT /api/members/:memberId
{ role: 'moderator' }
```

### Group Roles

**On Group Creation:**
```typescript
creator → admin (automatic)
```

**When Joining:**
```typescript
new member → member (default)
```

**Promoting Members:**
```typescript
// Only group admins can promote
PUT /api/groups/:groupId/members/:memberId/promote
→ member becomes admin

PUT /api/groups/:groupId/members/:memberId/demote
→ admin becomes member
```

---

## 🎨 UI Indicators

### Association Role Badges
```
[👑 Admin]     - Full control
[⭐ Moderator] - Can create groups
[👤 Member]    - Regular member
```

### Group Role Badges
```
[🛡️ Group Admin] - Can manage group
[👥 Member]      - Regular participant
```

### Where Roles Are Shown

**Community Groups Screen:**
- Shows "Requests" button only for group admins
- Shows "Create Group" button for association admin/moderator

**Group Info Screen:**
- Shows "Group Admin" badge next to admin names
- Shows manage options only to group admins

**Group Settings:**
- Only accessible to group admins
- Shows all group configuration options

---

## 🔐 Permission Matrix

| Action | Needs Association Role | Needs Group Role |
|--------|----------------------|------------------|
| Create group | admin/moderator | - |
| Join public group | member+ | - |
| Request private group | member+ | - |
| Approve join requests | - | admin |
| Change group settings | - | admin |
| Add group members | - | admin |
| Remove group members | - | admin |
| Promote to group admin | - | admin |
| Post in group | member+ | member+ (if allowed) |
| View group finances | member+ | member+ (if allowed) |
| Manage group finances | - | admin |

---

## 💡 Best Practices

### For Association Admins
1. **Don't make everyone an admin** - Use moderators for delegation
2. **Assign group admins** - Let group creators manage their own groups
3. **Review roles regularly** - Remove inactive admins

### For Group Admins
1. **Have multiple admins** - Avoid single point of failure
2. **Promote active members** - Distribute management load
3. **Use settings wisely** - Balance control and participation

### For Members
1. **Understand your permissions** - Know what you can/cannot do
2. **Request promotions** - Ask if you want more responsibility
3. **Respect group rules** - Follow posting permissions

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Custom association roles (treasurer, secretary, etc.)
- [ ] Group moderator role (between admin and member)
- [ ] Role-based permissions builder
- [ ] Temporary role assignments
- [ ] Role change notifications
- [ ] Role activity logs

### Possible Additions
- [ ] Sub-group hierarchies
- [ ] Cross-group admin privileges
- [ ] Role templates
- [ ] Automatic role expiration
- [ ] Role-based content visibility

---

## 📝 Summary

**Remember:**
- 🏢 Association role = What you can do in the community
- 👥 Group role = What you can do in each group
- 🔓 They are independent and don't inherit
- 🎯 Each serves a different purpose
- ⚖️ Balance control with participation

**The system is designed to:**
- Give flexibility in group management
- Allow distributed leadership
- Prevent power concentration
- Enable organic community growth
