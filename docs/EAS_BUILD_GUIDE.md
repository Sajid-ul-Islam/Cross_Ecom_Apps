# Expo & EAS Build Guide — DEEN Mobile App

> Reference guide for building, signing, and troubleshooting the `apps/mobile` React Native / Expo application on EAS Build and local environments.

---

## 1. Overview & Toolchain Specifications

- **Expo SDK**: `~55.0.0` (React Native 0.83+, React 19.2, Expo Router v7)
- **Node Environment**: Node 18+ (with `scripts/node18-polyfill.cjs`)
- **Icons Engine**: Custom in-house SVG stroke icon set (`src/components/Icons.tsx` on `react-native-svg`), eliminating React 19 peer dependency conflicts.
- **Build Configurations (`eas.json`)**:
  - `preview`: Internal testing APK (direct download/sideload)
  - `production`: Production APK / AAB for Google Play and iOS App Store
  - `development`: Dev client for debugging with native modules

---

## 2. Build Commands

### Android Builds
```bash
cd apps/mobile

# Build internal preview APK
npx eas build --platform android --profile preview

# Build production AAB for Google Play Store
npx eas build --platform android --profile production

# Check recent build status
npx eas build:list --platform android --limit 3
```

### iOS Builds
```bash
cd apps/mobile

# Build production IPA for Apple App Store (requires Xcode 16+ image)
npx eas build --platform ios --profile production

# Submit to App Store Connect
npx eas submit --platform ios --latest
```

---

## 3. Key Resolutions & Hardening History

### A. React 19 Peer Dependency Resolution
- **Issue**: Standard icon libraries (e.g. `lucide-react-native`) specified `react ^16.5 || ^17 || ^18` peer ranges, failing during EAS `npm install` under React 19.2.
- **Resolution**: Replaced with an in-house lightweight vector icon library ([Icons.tsx](file:///home/bearded/Documents/GitHub/Cross_Ecom_Apps/apps/mobile/src/components/Icons.tsx)) backed by `react-native-svg`. All 41 application icons are fully typed with identical `<Icon size={24} color="#..." />` APIs and zero third-party peer friction.

### B. Apple Xcode 16 & iOS 18 Compatibility
- **Issue**: Apple requires Xcode 16 / iOS 18 SDK binaries for all submissions. Older Expo SDKs (e.g. SDK 51) fail on modern EAS builders.
- **Resolution**: Upgraded mobile workspace to Expo SDK 55 with `ios.image = "latest"`, ensuring full App Store compliance.

### C. Build Quotas & Troubleshooting
- **Free Tier Quota**: EAS Free plan allows a monthly quota of Android builds. If the monthly limit is reached, EAS returns:
  `"This account has used its Android builds from the Free plan this month"`.
- **Resolution Options**:
  1. Wait for monthly quota reset (1st of each calendar month).
  2. Upgrade the EAS subscription plan in Expo dashboard (`expo.dev/accounts/<account>/settings/billing`).
  3. Local build via Android Studio / Gradle (`npx expo prebuild` then `cd android && ./gradlew assembleRelease`).
