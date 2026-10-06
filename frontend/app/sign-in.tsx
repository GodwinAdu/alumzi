import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInPage() {
  const router = useRouter();
  const { sendOTP, signIn, signUp, isSendingOTP, isSigningIn, isSigningUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [identifier, setIdentifier] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [error, setError] = useState<string>('');
  type Channel = 'email' | 'phone';
  const [channel, setChannel] = useState<Channel>('phone');

  const isEmail = (str: string) => /.+@.+\..+/.test(str);
  const isPhone = (str: string) => /^\+?[0-9\s()-]{7,15}$/.test(str);

  const identifierLabel = useMemo(() => (channel === 'email' ? 'Email' : 'Phone Number'), [channel]);
  const placeholder = useMemo(() => (channel === 'email' ? 'your@email.com' : '+1234567890'), [channel]);
  const keyboardType = useMemo(() => (channel === 'email' ? 'email-address' : 'phone-pad'), [channel]);

  const handleSendOTP = () => {
    console.log('[Auth] handleSendOTP', { isSignUp, channel, identifier });
    
    if (isSignUp) {
      // For signup, validate all fields
      if (!name.trim()) {
        setError('Please enter your name');
        return;
      }
      if (!email.trim()) {
        setError('Please enter your email');
        return;
      }
      if (!phoneNumber.trim()) {
        setError('Please enter your phone number');
        return;
      }
      if (!isEmail(email)) {
        setError('Enter a valid email');
        return;
      }
      if (!isPhone(phoneNumber)) {
        setError('Enter a valid phone number');
        return;
      }
      // Use phone number as identifier for OTP delivery
      setIdentifier(phoneNumber);
    } else {
      // For signin, use the identifier field
      if (!identifier.trim()) {
        setError(channel === 'email' ? 'Please enter your email' : 'Please enter your phone number');
        return;
      }
      if (channel === 'email' && !isEmail(identifier)) {
        setError('Enter a valid email');
        return;
      }
      if (channel === 'phone' && !isPhone(identifier)) {
        setError('Enter a valid phone number');
        return;
      }
    }

    setError('');
    const otpIdentifier = isSignUp ? phoneNumber : identifier;
    console.log('[Auth] Sending OTP via', channel, 'to', otpIdentifier);
    
    sendOTP({ identifier: otpIdentifier, channel, isSignUp }, {
      onSuccess: () => {
        console.log('[Auth] OTP sent successfully');
        setStep('otp');
      },
      onError: (err: Error) => {
        console.log('[Auth] OTP send error', err.message);
        setError(err.message);
      },
    });
  };

  const handleVerifyOTP = () => {
    console.log('[Auth] handleVerifyOTP');
    if (!otp.trim() || otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }
    setError('');

    if (isSignUp) {
      signUp({ name, email, phoneNumber, otp }, {
        onSuccess: () => {
          console.log('[Auth] Sign up success');
          router.replace('/(auth-tabs)/home');
        },
        onError: (err: Error) => {
          console.log('[Auth] Sign up error', err.message);
          setError(err.message);
        },
      });
    } else {
      signIn({ identifier, otp }, {
        onSuccess: (data: any) => {
          console.log('[Auth] Sign in success', data);
          if (data.requires2FA) {
            // Redirect to 2FA verification
            router.push(`/verify-2fa?tempToken=${data.tempToken}`);
          } else {
            router.replace('/(auth-tabs)/home');
          }
        },
        onError: (err: Error) => {
          console.log('[Auth] Sign in error', err.message);
          setError(err.message);
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <TouchableOpacity testID="btn-back" style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>

            <View style={styles.content}>
              <Text style={styles.title} testID="title-text">{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
              <Text style={styles.subtitle} testID="subtitle-text">
                {step === 'identifier'
                  ? `${isSignUp ? 'Enter your details to create account' : 'Choose sign in method and enter details'}`
                  : `Enter the OTP sent to your ${isSignUp ? 'phone' : channel}`}
              </Text>

              {step === 'identifier' ? (
                <View style={styles.form}>
                  {!isSignUp && (
                    <View style={styles.segmented}>
                      <TouchableOpacity
                        testID="channel-email"
                        accessibilityRole="button"
                        onPress={() => setChannel('email')}
                        style={[styles.segmentButton, channel === 'email' && styles.segmentButtonActive]}
                      >
                        <Text style={[styles.segmentText, channel === 'email' && styles.segmentTextActive]}>Email</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="channel-phone"
                        accessibilityRole="button"
                        onPress={() => setChannel('phone')}
                        style={[styles.segmentButton, channel === 'phone' && styles.segmentButtonActive]}
                      >
                        <Text style={[styles.segmentText, channel === 'phone' && styles.segmentTextActive]}>Phone</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isSignUp ? (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                          testID="input-name"
                          style={styles.input}
                          placeholder="John Doe"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={name}
                          onChangeText={setName}
                          autoCapitalize="words"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                          testID="input-email"
                          style={styles.input}
                          placeholder="your@email.com"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                          testID="input-phone"
                          style={styles.input}
                          placeholder="+1234567890"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={phoneNumber}
                          onChangeText={setPhoneNumber}
                          keyboardType="phone-pad"
                          autoCapitalize="none"
                        />
                      </View>
                    </>
                  ) : (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>{identifierLabel}</Text>
                      <TextInput
                        testID="input-identifier"
                        style={styles.input}
                        placeholder={placeholder}
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={identifier}
                        onChangeText={setIdentifier}
                        keyboardType={keyboardType}
                        autoCapitalize="none"
                      />
                    </View>
                  )}

                  {error ? <Text testID="error-text" style={styles.error}>{error}</Text> : null}

                  <TouchableOpacity 
                    testID="btn-continue" 
                    style={styles.button} 
                    onPress={handleSendOTP}
                    disabled={isSendingOTP}
                  >
                    <Text style={styles.buttonText}>
                      {isSendingOTP ? 'Sending...' : 'Continue'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity testID="btn-switch-mode" onPress={() => setIsSignUp(!isSignUp)}>
                    <Text style={styles.switchText}>
                      {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                      <Text style={styles.switchTextBold}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>One-Time Password</Text>
                    <TextInput
                      testID="input-otp"
                      style={styles.input}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  {error ? <Text testID="error-text" style={styles.error}>{error}</Text> : null}

                  <TouchableOpacity
                    testID="btn-verify"
                    style={styles.button}
                    onPress={handleVerifyOTP}
                    disabled={isSigningIn || isSigningUp}
                  >
                    <Text style={styles.buttonText}>
                      {isSigningIn || isSigningUp ? 'Verifying...' : 'Verify & Continue'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity testID="btn-resend" onPress={() => setStep('identifier')}>
                    <Text style={styles.switchText}>
                      <Text style={styles.switchTextBold}>Resend OTP</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 12,
  },
  backButton: {
    position: 'absolute',
    top: 8,
    left: 24,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
  },
  form: {
    gap: 20,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    padding: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: '#fff',
  },
  segmentText: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  segmentTextActive: {
    color: '#667eea',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  error: {
    color: '#ffcccc',
    fontSize: 14,
    marginTop: -4,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#667eea',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  switchText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    textAlign: 'center',
  },
  switchTextBold: {
    fontWeight: '700' as const,
    color: '#fff',
  },
});
