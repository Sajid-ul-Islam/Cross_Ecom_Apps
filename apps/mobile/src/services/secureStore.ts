export const AUTH_TOKEN_KEY = "deen_auth_token";

// Ensure React Native / Expo environment variable exists in non-Metro/Node runtimes
if (typeof (globalThis as any).__DEV__ === "undefined") {
  (globalThis as any).__DEV__ = process.env.NODE_ENV !== "production";
}

// Memory fallback store for environments without persistent storage
const memoryStore = new Map<string, string>();

function getAsyncStorage(): {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, val: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} {
  try {
    const mod = require("@react-native-async-storage/async-storage");
    return mod.default || mod;
  } catch {
    return {
      getItem: async (key: string) => memoryStore.get(key) ?? null,
      setItem: async (key: string, val: string) => { memoryStore.set(key, val); },
      removeItem: async (key: string) => { memoryStore.delete(key); },
    };
  }
}

function getSecureStore(): any {
  try {
    return require("expo-secure-store");
  } catch {
    return null;
  }
}

function isWeb(): boolean {
  try {
    const { Platform } = require("react-native");
    return Platform?.OS === "web";
  } catch {
    return typeof window !== "undefined";
  }
}

/**
 * Checks if hardware-backed SecureStore is supported on the current runtime.
 * Fallback to AsyncStorage on web or when SecureStore is not available.
 */
async function isSecureStoreAvailable(): Promise<boolean> {
  const ss = getSecureStore();
  if (!ss || isWeb()) return false;
  try {
    return await ss.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Hardware-encrypted JWT token storage (Apple Keychain / Android KeyStore).
 *
 * Backward-compatible migration:
 * 1. Reads from SecureStore first.
 * 2. If absent, checks legacy AsyncStorage.
 * 3. If found in AsyncStorage, transparently promotes the token to SecureStore
 *    and cleans up AsyncStorage so existing users are never logged out.
 */
export async function getSecureAuthToken(): Promise<string | null> {
  const asyncStorage = getAsyncStorage();
  const ss = getSecureStore();

  try {
    const available = await isSecureStoreAvailable();
    if (available && ss) {
      const secureToken = await ss.getItemAsync(AUTH_TOKEN_KEY);
      if (secureToken) {
        return secureToken;
      }

      // Backward-compatible migration check:
      const legacyToken = await asyncStorage.getItem(AUTH_TOKEN_KEY).catch(() => null);
      if (legacyToken) {
        // Transparently promote legacy token to hardware-encrypted SecureStore
        await ss.setItemAsync(AUTH_TOKEN_KEY, legacyToken).catch(() => {});
        // Clean up from unencrypted AsyncStorage
        await asyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
        return legacyToken;
      }
      return null;
    }
  } catch {
    // If SecureStore throws on device (e.g. key invalidation), fall back to AsyncStorage
  }

  // Fallback for web or if SecureStore is unavailable
  return asyncStorage.getItem(AUTH_TOKEN_KEY).catch(() => null);
}

/**
 * Store the JWT token in SecureStore (hardware encrypted).
 */
export async function setSecureAuthToken(token: string): Promise<void> {
  const asyncStorage = getAsyncStorage();
  const ss = getSecureStore();

  try {
    const available = await isSecureStoreAvailable();
    if (available && ss) {
      await ss.setItemAsync(AUTH_TOKEN_KEY, token);
      // Ensure no residual plaintext token remains in AsyncStorage
      await asyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
      return;
    }
  } catch {}

  // Fallback for web / unsupported environments
  await asyncStorage.setItem(AUTH_TOKEN_KEY, token).catch(() => {});
}

/**
 * Remove the JWT token from SecureStore and AsyncStorage.
 */
export async function deleteSecureAuthToken(): Promise<void> {
  const asyncStorage = getAsyncStorage();
  const ss = getSecureStore();

  try {
    const available = await isSecureStoreAvailable();
    if (available && ss) {
      await ss.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {});
    }
  } catch {}

  await asyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
}
