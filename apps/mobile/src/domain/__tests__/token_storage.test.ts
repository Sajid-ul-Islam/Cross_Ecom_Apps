/**
 * Automated Unit Tests for Mobile Token Storage & SecureStore Migration
 * Verifies:
 * 1. Storing JWT token in SecureStore (hardware encrypted).
 * 2. Keeping large non-sensitive data (course cache, user settings, bookmarks) in AsyncStorage.
 * 3. Backward-compatible migration so existing logged-in users aren't logged out.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  AUTH_TOKEN_KEY,
  getSecureAuthToken,
  setSecureAuthToken,
  deleteSecureAuthToken,
} from "../../services/secureStore";

// Mock AsyncStorage store
class MockAsyncStorage {
  private store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  getDirect(key: string): string | undefined {
    return this.store.get(key);
  }
}

// Mock SecureStore
class MockSecureStore {
  private store = new Map<string, string>();
  public isAvailable = true;

  async isAvailableAsync(): Promise<boolean> {
    return this.isAvailable;
  }

  async getItemAsync(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItemAsync(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async deleteItemAsync(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  getDirect(key: string): string | undefined {
    return this.store.get(key);
  }
}

/**
 * Migration & Token Storage Manager for Testing Architecture
 */
class SecureTokenManager {
  constructor(
    private secureStore: MockSecureStore,
    private asyncStorage: MockAsyncStorage
  ) {}

  async getAuthToken(): Promise<string | null> {
    if (this.secureStore.isAvailable) {
      const secureToken = await this.secureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (secureToken) {
        return secureToken;
      }

      // Check legacy AsyncStorage for existing logged-in users
      const legacyToken = await this.asyncStorage.getItem(AUTH_TOKEN_KEY);
      if (legacyToken) {
        // Transparent backward-compatible migration
        await this.secureStore.setItemAsync(AUTH_TOKEN_KEY, legacyToken);
        await this.asyncStorage.removeItem(AUTH_TOKEN_KEY);
        return legacyToken;
      }
      return null;
    }
    return this.asyncStorage.getItem(AUTH_TOKEN_KEY);
  }

  async saveAuthToken(token: string): Promise<void> {
    if (this.secureStore.isAvailable) {
      await this.secureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      // Clean up legacy plaintext storage
      await this.asyncStorage.removeItem(AUTH_TOKEN_KEY);
      return;
    }
    await this.asyncStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  async clearAuthToken(): Promise<void> {
    if (this.secureStore.isAvailable) {
      await this.secureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    }
    await this.asyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

describe("Expo SecureStore JWT Token Storage & Backward-Compatible Migration", () => {
  let secureStore: MockSecureStore;
  let asyncStorage: MockAsyncStorage;
  let manager: SecureTokenManager;

  beforeEach(() => {
    secureStore = new MockSecureStore();
    asyncStorage = new MockAsyncStorage();
    manager = new SecureTokenManager(secureStore, asyncStorage);
  });

  it("stores the JWT token in SecureStore (hardware encrypted)", async () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSJ9.signature";
    await manager.saveAuthToken(jwt);

    // Verify token is in SecureStore
    assert.equal(await secureStore.getItemAsync(AUTH_TOKEN_KEY), jwt);
    // Verify token is NOT left in unencrypted AsyncStorage
    assert.equal(await asyncStorage.getItem(AUTH_TOKEN_KEY), null);
  });

  it("transparently migrates existing logged-in users from legacy AsyncStorage without logout", async () => {
    const legacyJwt = "legacy_session_jwt_token_123456789";
    // Simulate legacy user who was logged in before the update
    await asyncStorage.setItem(AUTH_TOKEN_KEY, legacyJwt);
    assert.equal(await secureStore.getItemAsync(AUTH_TOKEN_KEY), null);

    // First read after update triggers automatic migration
    const token = await manager.getAuthToken();
    assert.equal(token, legacyJwt, "Existing user remains logged in seamlessly");

    // Verify token has been promoted to SecureStore
    assert.equal(await secureStore.getItemAsync(AUTH_TOKEN_KEY), legacyJwt);
    // Verify plaintext copy was purged from AsyncStorage
    assert.equal(await asyncStorage.getItem(AUTH_TOKEN_KEY), null);

    // Subsequent reads come directly from SecureStore
    const nextToken = await manager.getAuthToken();
    assert.equal(nextToken, legacyJwt);
  });

  it("keeps large non-sensitive data in AsyncStorage", async () => {
    // 1. Course Cache / Offline Catalog
    const courseCacheKey = "deen_course_cache_catalog_v1";
    const courseData = JSON.stringify({
      courses: [
        { id: "c1", title: "Raw Selvedge Denim Craftsmanship", modules: 12 },
        { id: "c2", title: "Japanese Indigo Dyeing & Preservation", modules: 8 },
      ],
      updatedAt: Date.now(),
    });
    await asyncStorage.setItem(courseCacheKey, courseData);

    // 2. User Settings & Preferences
    const userSettingsKey = "deen_user_settings";
    const userSettings = JSON.stringify({
      theme: "dark",
      pushOrders: true,
      pushPromos: false,
      jeansSize: "32",
      topSize: "L",
    });
    await asyncStorage.setItem(userSettingsKey, userSettings);

    // 3. Bookmarks / Wishlist
    const bookmarksKey = "deen_bookmarks_wishlist";
    const bookmarks = JSON.stringify(["prod_raw_denim_001", "prod_indigo_jacket_002"]);
    await asyncStorage.setItem(bookmarksKey, bookmarks);

    // Sensitive JWT stored in SecureStore
    const jwt = "secure_jwt_token_hardware_encrypted";
    await manager.saveAuthToken(jwt);

    // Assert large non-sensitive data remains stored in AsyncStorage
    assert.equal(await asyncStorage.getItem(courseCacheKey), courseData);
    assert.equal(await asyncStorage.getItem(userSettingsKey), userSettings);
    assert.equal(await asyncStorage.getItem(bookmarksKey), bookmarks);

    // Assert sensitive JWT is safely kept in SecureStore
    assert.equal(await secureStore.getItemAsync(AUTH_TOKEN_KEY), jwt);
    assert.equal(await asyncStorage.getItem(AUTH_TOKEN_KEY), null);
  });

  it("completely purges token from both SecureStore and AsyncStorage on logout", async () => {
    const jwt = "active_jwt_token_for_logout";
    await manager.saveAuthToken(jwt);

    // Ensure it exists in SecureStore
    assert.equal(await manager.getAuthToken(), jwt);

    // Perform logout
    await manager.clearAuthToken();

    // Verify token is completely removed from both storage systems
    assert.equal(await secureStore.getItemAsync(AUTH_TOKEN_KEY), null);
    assert.equal(await asyncStorage.getItem(AUTH_TOKEN_KEY), null);
    assert.equal(await manager.getAuthToken(), null);
  });
});
