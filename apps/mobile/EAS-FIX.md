# EAS build fixes — `@sajid.islam/deen-commerce`

Two consecutive failures, two different root causes, both diagnosed statically
(no log access) and fixed in-repo:

1. **iOS `production` (`7502b36c`)** — end-of-life SDK 51 → upgraded to SDK 55.
2. **Android `production-apk` (`3d6cae6a`)** — unresolvable `lucide-react-native`
   peer under React 19 → replaced with an in-house SVG icon module.

## Build 1 — iOS `production` (`7502b36c`, SDK 51)

### Diagnosis

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

### Fix applied

| change | why |
| ------ | --- |
| `expo ~55.0.0` (SDK 55: RN 0.83.1, React 19.2, expo-router v7) | current stable SDK, supported by EAS Build, compiles with Xcode 16+ and ships iOS 18 SDK binaries |
| companion deps bumped (constants 18, font 14, linking 8, status-bar 3, screens ~4.19, safe-area ~5.6, gesture-handler ~2.30, svg 15.15, async-storage 2.2) | SDK 55 peer set |
| removed `react-native-reanimated` | zero imports in the app; v4 needs the separate `react-native-worklets` babel plugin and is a known native build-break risk |
| deleted `package-lock.json` | SDK-51-resolved lockfile; must regenerate against the new manifest |
| `eas.json` → `"ios": { "image": "latest" }`, `cli >= 16` | explicit Xcode 16+ image, modern EAS baseline |

### Recover locally (required once, ~5 min)

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

## Build 2 — Android `production-apk` (`3d6cae6a`, SDK 55)

The SDK 55 upgrade landed (commit `1f72104`), but the Android APK build then
failed at the **install step**, before Gradle ever ran:

- The manifest pinned `lucide-react-native ^0.394.0` (mid-2024). That line
  declares `react ^16.5 || ^17 || ^18` as a peer, which is **unresolvable
  against React 19.2.0** (required by SDK 55).
- No lockfile is committed (it was deliberately removed with the SDK 51
  manifest), so EAS runs a plain `npm install` — which aborts with
  `ERESOLVE could not resolve` on the lucide peer conflict. The failure is
  platform-agnostic; Android was simply retried first.

### Fix applied

| change | why |
| ------ | --- |
| removed `lucide-react-native` | its React-18 peer range can never resolve on SDK 55 |
| added `src/components/Icons.tsx` | 41 hand-drawn 24×24 stroke icons on `react-native-svg` (already a dependency) — same `<Icon size color strokeWidth />` API, zero new peers |
| repointed all 10 icon import sites | drop-in swap from `lucide-react-native` to the local module |
| removed `eas-cli` from devDependencies | EAS docs recommend installing it globally; it only added install-graph risk |

The remaining dependency set is exactly what `npx expo install --fix`
verified for SDK 55, so the peer graph is now fully resolvable under React 19.

### Recover locally (required once)

```bash
cd apps/mobile
npx expo install --fix   # no-op sanity pass, regenerates package-lock.json
npx expo-doctor          # expect 0 problems
git add package-lock.json   # commit the lockfile so EAS runs npm ci
npx eas build --platform android --profile production-apk
```

Committing the lockfile matters: it turns the EAS install step into a
deterministic `npm ci` instead of a fresh resolution on every build.

## Rollback

The pre-SDK-55 state is at `9686f5a`. SDK 51 builds cannot be repaired on EAS —
do not roll the manifest back; roll forward with `--fix` if a dep conflicts
instead.
