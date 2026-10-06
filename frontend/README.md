# Alumzi Mobile App 📱

A comprehensive association management mobile application built with React Native and Expo. Alumzi helps schools, communities, and organizations manage members, finances, fundraisers, and communications in one unified platform.

## Features

### 🔐 Authentication
- WhatsApp-style OTP authentication (SMS/Email)
- Smart OTP delivery (Ghana numbers → SMS, others → Email)
- Device-based registration with JWT tokens
- 2FA integration support

### 👥 Member Management
- Role-based access control (Admin/Moderator/Member)
- Bulk member import from contacts
- Member profiles and activity tracking
- Join requests and approvals

### 💰 Financial Management
- Income and expense tracking
- Custom financial categories
- Real-time financial dashboard
- Member contribution tracking
- Payment processing with Paystack

### 🎯 Fundraising
- Create and manage fundraising campaigns
- Real-time progress tracking
- Secure payment contributions
- Goal completion notifications

### 💬 Real-Time Communication
- WhatsApp-style group chat
- Real-time messaging with Socket.IO
- Message deletion and management
- Typing indicators

### 🔔 Notifications
- Real-time push notifications
- Customizable notification preferences
- Financial update alerts
- Member activity notifications

### ⚙️ Association Settings
- Comprehensive settings management
- Permission controls
- Subscription plan management
- Multi-currency support

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Real-time**: Socket.IO client
- **Styling**: React Native StyleSheet
- **Authentication**: JWT tokens with AsyncStorage
- **Payments**: Paystack integration
- **Icons**: Lucide React Native

## Prerequisites

- Node.js 18+ 
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Expo Go app (for testing)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alumzi/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```bash
   # Update with your local IP address for device testing
   LOCAL_IP=192.168.1.170
   EXPO_PUBLIC_LOCAL_IP=192.168.1.170
   
   # API endpoints
   API_BASE_URL=http://192.168.1.170:8000/api
   SOCKET_URL=http://192.168.1.170:8000
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

## Development

### Project Structure
```
app/
├── (association-tabs)/     # Association-specific screens
├── (auth)/                # Authentication screens  
├── _layout.tsx           # Root layout
├── sign-in.tsx          # Sign in screen
├── contribute.tsx       # Fundraiser contribution
└── ...

contexts/
├── AuthContext.tsx      # Authentication state
├── SocketContext.tsx    # WebSocket connections
└── NotificationContext.tsx

hooks/
├── useSubscription.ts   # Subscription management
├── useFinancialPermissions.ts
└── useChat.ts          # Chat functionality

lib/
└── api.ts              # API client
```

### Key Features Implementation

#### Authentication Flow
- OTP-based authentication with smart delivery
- Device registration and JWT token management
- Automatic token refresh and error handling

#### Real-Time Features
- Socket.IO integration for live updates
- Real-time chat with message persistence
- Live financial updates and notifications

#### Payment Integration
- Paystack payment processing
- Deep link handling for payment returns
- Automatic payment verification

#### Role-Based Access
- Context-based permission system
- UI restrictions based on user roles
- Secure API endpoint protection

## Configuration

### Environment Variables
The app uses environment variables for configuration. Copy `.env.example` to `.env` and update:

```bash
# Network Configuration - Update with your local IP
LOCAL_IP=192.168.1.170
EXPO_PUBLIC_LOCAL_IP=192.168.1.170

# API Configuration
API_BASE_URL=http://192.168.1.170:8000/api
SOCKET_URL=http://192.168.1.170:8000

# Development
NODE_ENV=development
EXPO_PUBLIC_ENV=development
```

### Finding Your Local IP
**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig | findstr "IPv4"
```

### API Configuration (Legacy)
If not using environment variables, update the base URL in `/lib/api.ts`:
```typescript
const getBaseURL = () => {
  if (Platform.OS === 'android') {
    return 'http://YOUR_IP:8000/api';
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:8000/api';
  }
};
```

### Socket Configuration
Update WebSocket URL in `/contexts/SocketContext.tsx`:
```typescript
const SOCKET_URL = 'http://YOUR_IP:8000';
```

## Building for Production

### Development Build
```bash
npx expo run:ios
# or
npx expo run:android
```

### Production Build
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Testing

### Running on Device
1. Install Expo Go from App Store/Play Store
2. Scan QR code from `npx expo start`
3. Test all features in development mode

### Key Testing Areas
- Authentication flow with OTP
- Real-time chat functionality
- Payment processing (use test cards)
- Socket connections and live updates
- Role-based access controls

## Troubleshooting

### Common Issues

**Network Errors**
- Ensure backend server is running
- Check IP address configuration
- Verify firewall settings

**Socket Connection Issues**
- Confirm WebSocket URL is correct
- Check network connectivity
- Verify authentication tokens

**Payment Issues**
- Test with Paystack test keys
- Ensure deep link configuration
- Check callback URL setup

**Build Errors**
- Clear Expo cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Expo CLI version

## Contributing

1. Follow React Native best practices
2. Use TypeScript for type safety
3. Implement proper error handling
4. Add loading states for async operations
5. Test on both iOS and Android

## Architecture Notes

### State Management
- React Context for global state
- Local state for component-specific data
- AsyncStorage for persistence

### Navigation
- File-based routing with Expo Router
- Tab navigation for main sections
- Stack navigation for detailed views

### Real-Time Updates
- Socket.IO for live data synchronization
- Automatic reconnection handling
- Event-based state updates

### Security
- JWT token authentication
- Secure storage with AsyncStorage
- Role-based access control
- Input validation and sanitization
