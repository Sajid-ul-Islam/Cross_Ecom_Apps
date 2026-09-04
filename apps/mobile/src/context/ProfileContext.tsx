import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile, AccountType, SavedAddress } from "../types";
import { DEFAULT_PROFILE, GUEST_PROFILE } from "../services/api";
import {
  getProfile,
  saveProfile as apiSaveProfile,
  login as gatewayLogin,
  loginWithGoogle as gatewayLoginWithGoogle,
  loginWithFacebook as gatewayLoginWithFacebook,
  authMe,
  logout as gatewayLogout,
  createGuestSession,
  AuthUser,
} from "../services/gateway";

function normalizeProfile(p: Partial<UserProfile> | null): UserProfile {
  if (!p) return DEFAULT_PROFILE;
  const isAdmin = p.role === "admin";
  const isGuest = !isAdmin && (p.isGuest === true || p.accountType === "guest" || (!p.phone && !p.name));

  const accountType: AccountType = isAdmin ? "admin" : isGuest ? "guest" : "customer";
  const role = isAdmin ? "admin" : "customer";

  return {
    accountType,
    isGuest,
    username: isAdmin ? p.username || "admin" : p.username,
    role,
    name: p.name ?? (isGuest ? "" : DEFAULT_PROFILE.name),
    phone: p.phone ?? (isGuest ? "" : DEFAULT_PROFILE.phone),
    email: p.email ?? (isGuest ? "" : DEFAULT_PROFILE.email),
    address: p.address ?? (isGuest ? "" : DEFAULT_PROFILE.address),
    district: p.district ?? "BD-13",
    city: p.city ?? "Dhaka",
    area: p.area ?? "dhaka_standard",
    deliverySlot: p.deliverySlot ?? "any",
    deliveryNotes: p.deliveryNotes ?? "",
    jeansSize: p.jeansSize ?? "32",
    topSize: p.topSize ?? "L",
    pushOrders: p.pushOrders ?? true,
    pushPromos: p.pushPromos ?? (isGuest ? false : true),
    memberSince: p.memberSince ?? (isGuest ? undefined : "Aug 2024"),
    savedAddresses: p.savedAddresses ?? (isGuest ? [] : DEFAULT_PROFILE.savedAddresses),
  };
}

export type UserMode = "admin" | "registered" | "guest";

interface ProfileContextType {
  profile: UserProfile;
  currentMode: UserMode;
  loading: boolean;
  isLoggedIn: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchToGuestMode: () => Promise<void>;
  registerCustomer: (data: { name: string; phone: string; email?: string; password?: string; address?: string; district?: string; city?: string }) => Promise<void>;
  addSavedAddress: (addr: Omit<SavedAddress, "id">) => Promise<void>;
  removeSavedAddress: (id: string) => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string; role?: string }>;
  loginAsAdmin: (passcode?: string) => Promise<{ success: boolean; message?: string; role?: string }>;
  loginWithGoogle: (idToken?: string, email?: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithFacebook: (accessToken?: string, email?: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => normalizeProfile(DEFAULT_PROFILE));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Prefer a real authenticated session (WordPress login via gateway).
        const me = await authMe();
        if (me) {
          setProfile(
            normalizeProfile({
              ...DEFAULT_PROFILE,
              username: me.username,
              name: me.name,
              email: me.email,
              role: me.role,
              accountType: me.accountType,
              isGuest: false,
            })
          );
          setLoading(false);
          return;
        }
        // Otherwise resume any locally-saved profile.
        const stored = await getProfile();
        setProfile(normalizeProfile(stored));
      } catch {
        setProfile(normalizeProfile(DEFAULT_PROFILE));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = (next: UserProfile) => {
    const normalized = normalizeProfile(next);
    setProfile(normalized);
    apiSaveProfile(normalized);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    persist({ ...profile, ...updates });
  };

  const switchToGuestMode = async () => {
    await createGuestSession().catch(() => {});
    persist({
      ...GUEST_PROFILE,
      accountType: "guest",
      isGuest: true,
      role: "customer",
    });
  };

  const registerCustomer = async (data: { name: string; phone: string; email?: string; password?: string; address?: string; district?: string; city?: string }) => {
    persist({
      ...profile,
      accountType: "customer",
      isGuest: false,
      role: "customer",
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || profile.email,
      address: data.address?.trim() || profile.address,
      district: data.district || profile.district,
      city: data.city?.trim() || profile.city,
      memberSince: profile.memberSince || new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    });
  };

  const addSavedAddress = async (addr: Omit<SavedAddress, "id">) => {
    const newAddress: SavedAddress = {
      ...addr,
      id: `addr_${Date.now()}`,
    };
    const prevList = profile.savedAddresses || [];
    const updated = [newAddress, ...prevList];
    persist({
      ...profile,
      savedAddresses: updated,
    });
  };

  const removeSavedAddress = async (id: string) => {
    const prevList = profile.savedAddresses || [];
    const updated = prevList.filter((a) => a.id !== id);
    persist({
      ...profile,
      savedAddresses: updated,
    });
  };

  const login = async (username: string, password: string) => {
    const res = await gatewayLogin(username.trim(), password);
    if (res.success && res.user) {
      const me = res.user;
      persist({
        ...DEFAULT_PROFILE,
        username: me.username,
        name: me.name,
        email: me.email,
        role: me.role,
        accountType: me.accountType,
        isGuest: false,
      });
      return { success: true, message: res.message, role: me.role };
    }
    return { success: res.success, message: res.message, role: undefined };
  };

  const loginAsAdmin = async (passcode: string = "admin") => {
    return login("admin", passcode);
  };

  const loginWithGoogle = async (idToken?: string, email?: string, name?: string) => {
    const res = await gatewayLoginWithGoogle(idToken, email, name);
    if (res.success && res.user) {
      const me = res.user;
      persist({
        ...DEFAULT_PROFILE,
        username: me.username,
        name: me.name,
        email: me.email,
        role: me.role,
        accountType: me.accountType,
        isGuest: false,
      });
    }
    return { success: res.success, message: res.message };
  };

  const loginWithFacebook = async (accessToken?: string, email?: string, name?: string) => {
    const res = await gatewayLoginWithFacebook(accessToken, email, name);
    if (res.success && res.user) {
      const me = res.user;
      persist({
        ...DEFAULT_PROFILE,
        username: me.username,
        name: me.name,
        email: me.email,
        role: me.role,
        accountType: me.accountType,
        isGuest: false,
      });
    }
    return { success: res.success, message: res.message };
  };

  const logout = async () => {
    await gatewayLogout().catch(() => {});
    persist(normalizeProfile(DEFAULT_PROFILE));
  };

  const currentMode: UserMode =
    profile.role === "admin" ? "admin" : profile.isGuest ? "guest" : "registered";

  const isLoggedIn = !profile.isGuest && !!profile.username;

  return (
    <ProfileContext.Provider
      value={{
        profile,
        currentMode,
        loading,
        isLoggedIn,
        updateProfile,
        switchToGuestMode,
        registerCustomer,
        addSavedAddress,
        removeSavedAddress,
        login,
        loginAsAdmin,
        loginWithGoogle,
        loginWithFacebook,
        logout,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
};
