# EAS build fix — iOS `production` failure (build `7502b36c`)

## Diagnosis

The failed build ran **Expo SDK 51** (`sdkVersion: 51.0.0` in the build metadata).
SDK 51 can no longer produce an App Store build:

1. **Apple requires binaries built with Xcode 16 (iOS 18 SDK)** for all new App
   Store submissions since 24 April 2025. SDK 51 only supports Xcode 15.x.
2. **EAS Build retired the Xcode 15 images**, so the iOS production build runs on
   Xcode 16+ images where SDK 51's React Native 0.74 pods fail to compile
   (CocoaPods/xcodebuild stage — the typical failure point for this build id).
3. The committed `package-lock.json` was resolved against SDK 51 and would also
   break `npm ci` once the manifest changed.

Static audit confirmed the JS side was otherwise sound: every import
(`expo-router`, `react-native-svg`, `lucide-react-native`, `async-storage`,
`safe-area-context`, `expo-constants`) is a declared dependency, `app.json` has
a valid `bundleIdentifier` + `eas.projectId`, and the router entry
(`expo-router/entry`) is intact.

## Fix applied

| change | why |
| ------ | --- |
| `expo ~55.0.0` (SDK 55: RN 0.83.1, React 19.2, expo-router v7) | current stable SDK, supported by EAS Build, compiles with Xcode 16+ and ships iOS 18 SDK binaries |
| companion deps bumped (constants 18, font 14, linking 8, status-bar 3, screens ~4.19, safe-area ~5.6, gesture-handler ~2.30, svg 15.15, async-storage 2.2) | SDK 55 peer set |
| removed `react-native-reanimated` | zero imports in the app; v4 needs the separate `react-native-worklets` babel plugin and is a known native build-break risk |
| deleted `package-lock.json` | SDK-51-resolved lockfile; must regenerate against the new manifest |
| `eas.json` → `"ios": { "image": "latest" }`, `cli >= 16` | explicit Xcode 16+ image, modern EAS baseline |

## Recover locally (required once, ~5 min)

```bash
cd apps/mobile
npx expo install --fix     # snaps every dep to SDK-55-verified versions, regenerates lockfile
npx expo-doctor            # sanity check: 0 problems expected
npx expo prebuild --clean  # regenerates ios/ + android/ native projects (if you keep native dirs)
npx eas build --platform ios --profile production
```

Then retry the failed build id flow, or submit the new build:

```bash
npx eas-cli@latest build:list --platform ios --limit 3
npx eas-cli@latest submit --platform ios --latest
```

If `expo install --fix` adjusts any companion version beyond what is pinned in
`package.json`, commit the resulting manifest + lockfile before rebuilding.

## Rollback

The previous state is one commit behind (`9686f5a`). SDK 51 builds cannot be
repaired on EAS — do not roll the manifest back; roll forward with `--fix` if a
dep conflicts instead.
