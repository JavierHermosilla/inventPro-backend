import type { ConfigContext, ExpoConfig } from "@expo/config";

const APP_NAME = "MobileManualInventory";
const DEFAULT_API_URL = "http://10.0.2.2:3000/api";
const DEFAULT_POLLING_MS = 20000;
const DEFAULT_EAS_PROJECT_ID = "c87e7ca0-55d5-415c-a8fe-a0918b1482aa";

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return ["true", "1", "yes", "si"].includes(value.trim().toLowerCase());
};

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
  const useMocks = parseBoolean(process.env.EXPO_PUBLIC_USE_API_MOCKS, false);
  const tasksPollingMs = parseNumber(process.env.EXPO_PUBLIC_TASKS_POLLING_MS, DEFAULT_POLLING_MS);

  return {
    ...config,
    name: APP_NAME,
    slug: "MobileManualInventory",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo-invent-pro.png",
    scheme: "mobilemanualinventory",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.EXPO_IOS_BUNDLE_IDENTIFIER || "com.inventpro.mobilemanualinventory",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/images/logo-invent-pro.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: process.env.EXPO_ANDROID_PACKAGE || "com.inventpro.mobilemanualinventory",
    },
    web: {
      output: "static",
      favicon: "./assets/images/logo-invent-pro.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#005B8F",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-secure-store",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      apiUrl,
      useMocks,
      tasksPollingMs,
      eas: {
        projectId: process.env.EXPO_PROJECT_ID ?? DEFAULT_EAS_PROJECT_ID,
      },
    },
  };
};
