# Role System Quick Reference

## 🎭 Two Independent Role Systems

```
┌─────────────────────────────────────────────────────────┐
│                    ALUMZI USER                          │
│                                                         │
│  ┌──────────────────────┐    ┌──────────────────────┐ │
│  │  ASSOCIATION ROLE    │    │    GROUP ROLES       │ │
│  │  (Community-wide)    │    │  (Per group basis)   │ │
│  │                      │    │                      │ │
│  │  • Admin             │    │  Group A: Admin      │ │
│  │  • Moderator         │    │  Group B: Member     │ │
│  │  • Member            │    │  Group C: Admin      │ │
│  └──────────────────────┘    └──────────────────────┘ │
│                                                         │
│  These roles are INDEPENDENT - one doesn't affect other│
└─────────────────────────────────────────────────────────┘
```

## 📋 Quick Permission Check

### Can I create a group?
```
✅ Association Admin or Moderator
❌ Association Member
```

### Can I manage group settings?
```
✅ Group Admin (regardless of association role)
❌ Group Member
```

### Can I approve join requests?
```
✅ Group Admin
❌ Everyone else (even association admins)
```

### Can I add members to association?
```
✅ Association Admin or Moderator
❌ Association Member
```

## 🎯 Common Scenarios

### Scenario 1: "I'm an association admin but can't change group settings"
**Why?** You need to be a **group admin** for that specific group.
**Solution:** Ask a group admin to promote you, or create your own group.

### Scenario 2: "I'm a group admin but can't create new groups"
**Why?** You need **association admin/moderator** role to create groups.
**Solution:** Ask an association admin to promote you to moderator.

### Scenario 3: "How do I become a group admin?"
**Options:**
1. Create a new group (you become admin automatically)
2. Ask current group admin to promote you
3. Be added as admin when group is created

## 🔄 Role Changes

### Changing Association Role
```typescript
// Only association admins can do this
Member → Moderator → Admin
```

### Changing Group Role
```typescript
// Only group admins can do this
Member ⟷ Admin
```

## 💡 Pro Tips

1. **Multiple Group Admins**: Have 2-3 admins per active group
2. **Delegate Wisely**: Make active members moderators
3. **Group Creators**: Automatically become group admins
4. **Default Groups**: Everyone auto-joins, but only association admins are group admins
5. **Leave Groups**: Can't leave default groups (Announcements, General)

## 🎨 Visual Indicators in App

### Community Groups Screen
```
┌─────────────────────────────────────┐
│ 📢 Announcements                    │
│    [Admin] [Admin only]             │
│    50 members                       │
│    [Requests] 💬                    │  ← Shows if you're group admin
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💰 Finance Committee                │
│    25 members                       │
│    💬                               │  ← No admin badge = you're member
└─────────────────────────────────────┘
```

### Group Info Screen
```
Members (25)
├─ John Doe [Group Admin]  ← Badge shows group role
├─ Jane Smith [Group Admin]
├─ Bob Wilson
└─ Alice Brown
```

## 🔐 Security Notes

- Association admins CANNOT automatically manage all groups
- Group admins CANNOT change association settings
- Roles are checked on every API request
- Invalid role changes return 403 Forbidden
- Role changes are logged (future feature)

## 📱 Where to Manage Roles

### Association Roles
- **Location**: Member Management screen
- **Who**: Association admins only
- **Path**: Association → Members → Edit Member

### Group Roles
- **Location**: Group Info screen
- **Who**: Group admins only
- **Path**: Group → Info → Click member → Promote/Demote
