// app.config.js — runtime/CI config injection for Expo.
//
// SECURITY: the gateway API key is read from the environment
// (EXPO_PUBLIC_GATEWAY_API_KEY) instead of being hardcoded in app.json.
// Set it locally via a `.env` file (gitignored) or in EAS build secrets:
//   eas secret:create --scope project --name EXPO_PUBLIC_GATEWAY_API_KEY --value "..."
//
// The fallback below mirrors the value that was previously committed in
// app.json so existing local builds keep working, BUT you should treat it as
// a placeholder: rotate the key and rely on the env var / EAS secret. Because
// any value shipped in this file is still extractable from the bundle, the
// key only identifies the store to the gateway (it is NOT a WooCommerce
// secret) — the real Woo credentials live only on the gateway server.

const fallbackGatewayApiKey = "fa002b126085801f23d9375d94409752503639919e39690c42877fc58c624973";

module.exports = () => {
  const gatewayApiKey = process.env.EXPO_PUBLIC_GATEWAY_API_KEY || fallbackGatewayApiKey;

  return {
    expo: {
      name: "DEEN",
      slug: "deen-commerce",
      version: "1.0.1",
      orientation: "portrait",
      icon: "./assets/icon.png",
      scheme: "deen",
      userInterfaceStyle: "automatic",
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.deencommerce.app",
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#000000",
        },
        package: "com.deencommerce.app",
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
    },
  };
};
