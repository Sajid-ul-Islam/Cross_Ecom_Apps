/**
 * withLocalSigning — local release-signing injection for the DEEN Android app.
 *
 * Reads credentials from `keystore/keystore.properties` (gitignored) and:
 *   1. Copies the .jks + properties into android/keystore/ during prebuild
 *      (android/ is also gitignored, so credentials never reach git).
 *   2. Appends a signingConfig block to android/app/build.gradle that wires
 *      the release build type to that keystore when the files exist.
 *
 * If keystore/keystore.properties is absent, nothing is injected and the
 * release build stays unsigned (EAS cloud builds are unaffected: they use
 * Expo-managed credentials).
 *
 * Expected keystore/keystore.properties:
 *   storeFile=deen-release.jks        (file name or keystore/-relative path)
 *   storePassword=...
 *   keyAlias=...
 *   keyPassword=...
 */
const { withDangerousMod, withAppBuildGradle } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "DEEN LOCAL RELEASE SIGNING";

const SIGNING_BLOCK = `
def deenKeystorePropsFile = rootProject.file("keystore/keystore.properties")
if (deenKeystorePropsFile.exists()) {
    def deenKeystoreProps = new Properties()
    deenKeystorePropsFile.withInputStream { deenKeystoreProps.load(it) }
    def deenKsPath = deenKeystoreProps["storeFile"].toString()
    if (!deenKsPath.startsWith("keystore/")) {
        deenKsPath = "keystore/" + deenKsPath
    }
    android {
        signingConfigs {
            deenRelease {
                storeFile rootProject.file(deenKsPath)
                storePassword deenKeystoreProps["storePassword"]
                keyAlias deenKeystoreProps["keyAlias"]
                keyPassword deenKeystoreProps["keyPassword"]
            }
        }
        buildTypes {
            release {
                signingConfig signingConfigs.deenRelease
            }
        }
    }
}`;

const withLocalSigning = (config) => {
  // 1. Copy credentials into the generated android/ project
  config = withDangerousMod(config, [
    "android",
    (cfg) => {
      const androidRoot = cfg.modRequest.platformProjectRoot;
      const ksDir = path.join(__dirname, "..", "keystore");
      const propsFile = path.join(ksDir, "keystore.properties");
      if (fs.existsSync(propsFile)) {
        const dest = path.join(androidRoot, "keystore");
        fs.mkdirSync(dest, { recursive: true });
        for (const f of fs.readdirSync(ksDir)) {
          if (f === "keystore.properties" || f.endsWith(".jks") || f.endsWith(".keystore")) {
            fs.copyFileSync(path.join(ksDir, f), path.join(dest, f));
          }
        }
      }
      return cfg;
    },
  ]);

  // 2. Wire the release build type to the copied keystore
  config = withAppBuildGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents += `\n// >>> ${MARKER} (injected by plugins/withLocalSigning.js)\n${SIGNING_BLOCK}\n// <<< ${MARKER}\n`;
    }
    return cfg;
  });

  return config;
};

module.exports = withLocalSigning;
