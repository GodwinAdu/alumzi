import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthContext } from "@/contexts/AuthContext";
import { AssociationContext } from "@/contexts/AssociationContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import { SessionManager } from "@/components/SessionManager";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="join" options={{ title: "Join Association" }} />
      <Stack.Screen name="create-association" options={{ title: "Create Association" }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="(auth-tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(association-tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: "My Profile" }} />
      <Stack.Screen name="add-member" options={{ title: "Add Member" }} />
      <Stack.Screen name="record-income" options={{ title: "Record Income" }} />
      <Stack.Screen name="record-expense" options={{ title: "Record Expense" }} />
      <Stack.Screen name="setup-2fa" options={{ headerShown: false }} />
      <Stack.Screen name="verify-2fa" options={{ headerShown: false }} />
      <Stack.Screen name="manage-2fa" options={{ headerShown: false }} />
      <Stack.Screen name="community-groups" options={{ headerShown: false }} />
      <Stack.Screen name="group-chat" options={{ headerShown: false }} />
      <Stack.Screen name="create-group" options={{ title: 'Create Group' }} />
      <Stack.Screen name="group-financial-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="consolidated-finances" options={{ headerShown: false }} />
      <Stack.Screen name="group-settings" options={{ headerShown: false }} />
      <Stack.Screen name="group-info" options={{ headerShown: false }} />
      <Stack.Screen name="group-join-requests" options={{ headerShown: false }} />
      <Stack.Screen name="add-group-members" options={{ headerShown: false }} />
      <Stack.Screen name="group-events" options={{ headerShown: false }} />
      <Stack.Screen name="group-polls" options={{ headerShown: false }} />
      <Stack.Screen name="group-announcements" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext>
        <AssociationContext>
          <NotificationContext>
            <SessionManager />
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </NotificationContext>
        </AssociationContext>
      </AuthContext>
    </QueryClientProvider>
  );
}
