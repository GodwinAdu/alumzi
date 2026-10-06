import 'dotenv/config';

export default {
  expo: {
    name: "Alumzi",
    slug: "alumzi",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: process.env.EXPO_PUBLIC_SCHEME || "alumzi",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.alumzi.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.alumzi.app"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      apiUrl: process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_URL,
      wsUrl: process.env.SOCKET_URL || process.env.EXPO_PUBLIC_WS_URL,
      localIp: process.env.LOCAL_IP || process.env.EXPO_PUBLIC_LOCAL_IP,
      environment: process.env.NODE_ENV || process.env.EXPO_PUBLIC_ENV || 'development',
      eas: {
        projectId: "your-project-id-here"
      }
    }
  }
};