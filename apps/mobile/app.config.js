// app.config.js — runtime/CI config injection for Expo.
const fallbackGatewayApiKey = "fa002b126085801f23d9375d94409752503639919e39690c42877fc58c624973";

module.exports = ({ config }) => {
  const isProd = process.env.NODE_ENV === "production" || process.env.EAS_BUILD_PROFILE === "production";
  const gatewayApiKey = process.env.EXPO_PUBLIC_GATEWAY_API_KEY || (isProd ? "" : fallbackGatewayApiKey);

  return {
    ...config,
    name: "DEEN",
    slug: "deen-commerce",
    version: config.version || "1.0.3",
    orientation: "portrait",
    icon: "./assets/icon.png",
    logo: "./assets/logo.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },
    scheme: "deen",
    userInterfaceStyle: "automatic",
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/6e5914c5-c56c-4cc7-ad0b-f9bf6cf3d7bd",
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.deencommerce.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon_light.png",
        monochromeImage: "./assets/icon_dark.png",
        backgroundColor: "#FF6B00",
      },
      package: "com.deencommerce.app",
      versionCode: config.android?.versionCode || 3,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-status-bar",
      "./plugins/withLocalSigning.js",
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            minSdkVersion: 24,
            extraGradleProperties: {
              "org.gradle.jvmargs":
                "-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:HeapBaseMinAddress=0x100000000",
            },
          },
          ios: {
            deploymentTarget: "16.4",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      ...(config?.extra || {}),
      router: {
        origin: false,
      },
      gatewayUrl: "https://cross-ecom-apps.onrender.com",
      gatewayUrls: ["https://cross-ecom-apps-4b4n.onrender.com"],
      gatewayApiKey,
      eas: {
        projectId: "6e5914c5-c56c-4cc7-ad0b-f9bf6cf3d7bd",
      },
    },
    owner: "b3ngali",
  };
};
