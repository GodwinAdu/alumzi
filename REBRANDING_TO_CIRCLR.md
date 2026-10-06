# 🎯 Rebranding to Circlr - Complete Checklist

## ✅ Completed Changes

### Frontend
- [x] Updated `app.json` - App name to "Circlr"
- [x] Updated `app.json` - Slug to "circlr"
- [x] Updated `app.json` - Scheme to "circlr"
- [x] Updated `app.json` - iOS bundle identifier to "com.circlr.app"
- [x] Updated `app.json` - Android package to "com.circlr.app"
- [x] Updated `app.json` - Brand color to #667eea (purple)
- [x] Updated `package.json` - Name to "circlr"

### Backend
- [x] Updated `package.json` - Name to "circlr-server"
- [x] Updated `package.json` - Description

---

## 📋 Additional Changes Needed

### 1. Environment Variables
Update `.env` files with new branding:
```bash
# Frontend: /frontend/.env
EXPO_PUBLIC_APP_NAME=Circlr
EXPO_PUBLIC_SCHEME=circlr

# Server: /server/.env
APP_NAME=Circlr
```

### 2. README Files
- [ ] Update `/README.md` with Circlr branding
- [ ] Update `/frontend/README.md`
- [ ] Update `/server/README.md`

### 3. Documentation Files
- [ ] Update all markdown files mentioning "alumzi" or "unigroup"
- [ ] Update API documentation
- [ ] Update feature documentation

### 4. Code Comments
Search and replace in codebase:
```bash
# Find references
grep -r "alumzi" --exclude-dir=node_modules
grep -r "unigroup" --exclude-dir=node_modules
grep -r "Alumzi" --exclude-dir=node_modules
grep -r "UniGroup" --exclude-dir=node_modules
```

### 5. Database/Models
- [ ] Review model names (Association vs Circle?)
- [ ] Consider renaming "Association" to "Circle" for consistency
- [ ] Update any hardcoded strings in database

### 6. Assets & Branding
- [ ] Create new app icon with circular design
- [ ] Update splash screen
- [ ] Create new logo
- [ ] Update favicon
- [ ] Design brand colors:
  - Primary: #667eea (purple)
  - Secondary: #764ba2 (darker purple)
  - Accent: #f093fb (pink)

### 7. App Store Listings
- [ ] iOS App Store name: "Circlr"
- [ ] Google Play Store name: "Circlr"
- [ ] App descriptions
- [ ] Screenshots
- [ ] Keywords: circle, group, community, finance, management

### 8. Domain & Social Media
- [ ] Register circlr.app
- [ ] Register circlr.io
- [ ] Register circlr.com (if available)
- [ ] Twitter/X: @circlr
- [ ] Instagram: @circlr
- [ ] Facebook: /circlr
- [ ] LinkedIn: /company/circlr

### 9. Legal
- [ ] Trademark search for "Circlr"
- [ ] Update Terms of Service
- [ ] Update Privacy Policy
- [ ] Update company name in legal docs

### 10. Marketing Materials
- [ ] Website copy
- [ ] Email templates
- [ ] Push notification templates
- [ ] SMS templates
- [ ] Social media templates

---

## 🎨 Brand Guidelines

### Logo Concept
- Circular design with interconnected dots
- Modern, minimalist style
- Works in monochrome and color

### Color Palette
```
Primary Purple:   #667eea
Dark Purple:      #764ba2
Light Purple:     #a8b3ff
Accent Pink:      #f093fb
Success Green:    #10b981
Warning Orange:   #f59e0b
Error Red:        #ef4444
```

### Typography
- Headings: Inter Bold/Black
- Body: Inter Regular/Medium
- Monospace: JetBrains Mono

### Tagline Options
1. "Your circle, organized"
2. "Where circles connect"
3. "Manage your circle, together"
4. "Every circle has a story"

---

## 🚀 Deployment Checklist

### Before Launch
- [ ] Test app with new name on iOS
- [ ] Test app with new name on Android
- [ ] Verify deep links work with new scheme
- [ ] Test push notifications
- [ ] Update API base URLs if needed
- [ ] Update analytics tracking

### Launch Day
- [ ] Submit to App Store
- [ ] Submit to Play Store
- [ ] Update website
- [ ] Announce on social media
- [ ] Email existing users (if any)
- [ ] Press release

---

## 📱 Quick Commands

### Rebuild Frontend
```bash
cd frontend
rm -rf node_modules .expo
npm install
npx expo prebuild --clean
```

### Test New Branding
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### Build for Production
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

---

## ✨ Next Steps

1. **Immediate:** Test the app with new name
2. **This Week:** Update all documentation
3. **This Month:** Complete rebranding assets
4. **Before Launch:** Register domains and social media

---

**Status:** Rebranding in progress 🎨
**Target Launch:** TBD
**Brand:** Circlr - Your circle, organized
