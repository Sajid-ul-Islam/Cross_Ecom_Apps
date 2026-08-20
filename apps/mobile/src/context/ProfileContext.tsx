import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile } from "../types";
import { DEFAULT_PROFILE } from "../services/api";
import { getProfile, saveProfile as apiSaveProfile } from "../services/gateway";

function deriveRole(p: UserProfile): UserProfile {
  const isAdmin = p.username?.trim().toLowerCase() === "admin";
  return { ...p, role: isAdmin ? "admin" : "customer" };
}

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  loginAsAdmin: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => deriveRole(DEFAULT_PROFILE));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = deriveRole(await getProfile());
      setProfile(p);
      setLoading(false);
    })();
  }, []);

  const persist = (next: UserProfile) => {
    const derived = deriveRole(next);
    setProfile(derived);
    apiSaveProfile(derived);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    persist({ ...profile, ...updates });
  };

  const loginAsAdmin = async () => {
    persist({ ...profile, username: "admin", role: "admin" });
  };

  const logoutAdmin = async () => {
    persist({ ...profile, username: undefined, role: "customer" });
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, loginAsAdmin, logoutAdmin, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
};
