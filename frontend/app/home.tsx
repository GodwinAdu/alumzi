import React, { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useAssociation } from "@/contexts/AssociationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ENTERED_ASSOCIATION_KEY = "@entered_association";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { userAssociations } = useAssociation();

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (isAuthenticated) {
        const entered = await AsyncStorage.getItem(ENTERED_ASSOCIATION_KEY);

        router.replace("/(auth-tabs)/home");
      }
    };
    checkAndRedirect();
  }, [isAuthenticated, userAssociations]);

  return null;
}
