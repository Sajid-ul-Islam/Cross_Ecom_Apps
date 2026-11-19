/**
 * Clean Architecture --- Secure Storage Repository
 *
 * Implements ISecureStorage with memory cache and persistent storage.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ISecureStorage } from "../../domain/repositories/ISecureStorage";

export class SecureStorageRepository implements ISecureStorage {
  private static instance: SecureStorageRepository;
  private cache: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): SecureStorageRepository {
    if (!SecureStorageRepository.instance) {
      SecureStorageRepository.instance = new SecureStorageRepository();
    }
    return SecureStorageRepository.instance;
  }

  public async getItem(key: string): Promise<string | null> {
    if (this.cache.has(key)) {
      return this.cache.get(key) ?? null;
    }
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        this.cache.set(key, value);
      }
      return value;
    } catch {
      return null;
    }
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.cache.set(key, value);
    try {
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.warn(`[SecureStorage] Failed to persist key: ${key}`, err);
    }
  }

  public async removeItem(key: string): Promise<void> {
    this.cache.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn(`[SecureStorage] Failed to remove key: ${key}`, err);
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}
