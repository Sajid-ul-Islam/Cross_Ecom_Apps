import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile, AccountType, DemoAccount } from "../types";
import { DEFAULT_PROFILE, GUEST_PROFILE, DEMO_ACCOUNTS } from "../services/api";
import { getProfile, saveProfile as apiSaveProfile } from "../services/gateway";

function normalizeProfile(p: Partial<UserProfile> | null): UserProfile {
  if (!p) return DEFAULT_PROFILE;
  const isAdmin = p.username?.trim().toLowerCase() === "admin" || p.role === "admin";
  const isGuest = !isAdmin && (p.isGuest === true || p.accountType === "guest" || (!p.phone && !p.name));
  
  const accountType: AccountType = isAdmin ? "admin" : isGuest ? "guest" : "customer";
  const role = isAdmin ? "admin" : "customer";

  return {
    accountType,
    isGuest,
    username: isAdmin ? "admin" : p.username,
    role,
    name: p.name ?? (isGuest ? "" : DEFAULT_PROFILE.name),
    phone: p.phone ?? (isGuest ? "" : DEFAULT_PROFILE.phone),
    email: p.email ?? (isGuest ? "" : DEFAULT_PROFILE.email),
    address: p.address ?? (isGuest ? "" : DEFAULT_PROFILE.address),
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
  demoAccounts: DemoAccount[];
  activeDemoId: string | null;
  setAccountMode: (mode: UserMode) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchToGuestMode: () => Promise<void>;
  registerCustomer: (data: { name: string; phone: string; email?: string; address?: string }) => Promise<void>;
  loginAsAdmin: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
  loginAsDemoAccount: (id: string) => Promise<void>;
  loginWithCredentials: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; message: string; account?: DemoAccount }>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => normalizeProfile(DEFAULT_PROFILE));
  const [activeDemoId, setActiveDemoId] = useState<string | null>("customer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getProfile();
        const norm = normalizeProfile(stored);
        setProfile(norm);
        if (norm.role === "admin") setActiveDemoId("admin");
        else if (norm.isGuest) setActiveDemoId("guest");
        else if (norm.phone?.includes("776655")) setActiveDemoId("vip");
        else setActiveDemoId("customer");
      } catch {
        setProfile(normalizeProfile(DEFAULT_PROFILE));
        setActiveDemoId("customer");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = (next: UserProfile, demoId?: string | null) => {
    const normalized = normalizeProfile(next);
    setProfile(normalized);
    if (demoId !== undefined) {
      setActiveDemoId(demoId);
    } else {
      if (normalized.role === "admin") setActiveDemoId("admin");
      else if (normalized.isGuest) setActiveDemoId("guest");
      else if (normalized.phone?.includes("776655")) setActiveDemoId("vip");
      else setActiveDemoId(null);
    }
    apiSaveProfile(normalized);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    persist({ ...profile, ...updates });
  };

  const switchToGuestMode = async () => {
    persist(
      {
        ...GUEST_PROFILE,
        accountType: "guest",
        isGuest: true,
        role: "customer",
      },
      "guest"
    );
  };

  const registerCustomer = async (data: { name: string; phone: string; email?: string; address?: string }) => {
    persist(
      {
        ...profile,
        accountType: "customer",
        isGuest: false,
        role: "customer",
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || profile.email,
        address: data.address?.trim() || profile.address,
        memberSince: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      },
      null
    );
  };

  const loginAsAdmin = async () => {
    const adminAcc = DEMO_ACCOUNTS.find((a) => a.id === "admin");
    persist(
      {
        ...profile,
        username: "admin",
        role: "admin",
        accountType: "admin",
        isGuest: false,
        name: adminAcc?.name || "DEEN Store Admin",
        phone: adminAcc?.phone || "01711-223344",
        email: adminAcc?.email || "admin@deen.com",
      },
      "admin"
    );
  };

  const logoutAdmin = async () => {
    persist(
      {
        ...DEFAULT_PROFILE,
        username: "customer",
        role: "customer",
        accountType: "customer",
        isGuest: false,
      },
      "customer"
    );
  };

  const loginAsDemoAccount = async (id: string) => {
    const target = DEMO_ACCOUNTS.find((a) => a.id === id);
    if (!target) return;

    if (target.accountType === "guest") {
      await switchToGuestMode();
      return;
    }

    const isAdmin = target.role === "admin";
    persist(
      {
        ...profile,
        accountType: target.accountType,
        isGuest: false,
        role: target.role,
        username: target.username,
        name: target.name,
        phone: target.phone,
        email: target.email,
        address: target.address,
        area: target.area,
        jeansSize: target.jeansSize,
        topSize: target.topSize,
        memberSince: "Aug 2024",
      },
      target.id
    );
  };

  const loginWithCredentials = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; message: string; account?: DemoAccount }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/[^0-9]/g, "");

    // 1. Check against Demo Accounts
    const matched = DEMO_ACCOUNTS.find((acc) => {
      const matchUsername = acc.username.toLowerCase() === cleanId;
      const matchEmail = acc.email.toLowerCase() === cleanId;
      const matchPhone = cleanPhone && acc.phone.replace(/[^0-9]/g, "") === cleanPhone;
      return matchUsername || matchEmail || matchPhone;
    });

    if (matched) {
      if (matched.password && matched.password !== password.trim()) {
        return {
          success: false,
          message: `Incorrect password for ${matched.name}. (Hint: ${matched.password})`,
        };
      }

      await loginAsDemoAccount(matched.id);
      return {
        success: true,
        message: `Welcome back, ${matched.name}! Logged in as ${matched.badge}.`,
        account: matched,
      };
    }

    // 2. Generic fallback for custom registered users
    if (cleanPhone.length >= 10 || cleanId.includes("@")) {
      persist({
        ...profile,
        accountType: "customer",
        isGuest: false,
        role: "customer",
        name: cleanId.split("@")[0] || "Custom Shopper",
        phone: identifier,
        email: cleanId.includes("@") ? cleanId : profile.email,
      });

      return {
        success: true,
        message: `Signed in successfully as ${identifier}.`,
      };
    }

    return {
      success: false,
      message: "Account not found. Please try a demo account (e.g. customer, vip, admin) or check credentials.",
    };
  };

  const currentMode: UserMode =
    profile.role === "admin"
      ? "admin"
      : profile.isGuest
      ? "guest"
      : "registered";

  const setAccountMode = async (mode: UserMode) => {
    if (mode === "admin") {
      await loginAsAdmin();
    } else if (mode === "guest") {
      await switchToGuestMode();
    } else {
      await loginAsDemoAccount("customer");
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        currentMode,
        demoAccounts: DEMO_ACCOUNTS,
        activeDemoId,
        setAccountMode,
        updateProfile,
        switchToGuestMode,
        registerCustomer,
        loginAsAdmin,
        logoutAdmin,
        loginAsDemoAccount,
        loginWithCredentials,
        loading,
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
