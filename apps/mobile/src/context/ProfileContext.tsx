import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile } from "../types";
import { DEFAULT_PROFILE } from "../services/api";
import { getProfile, saveProfile as apiSaveProfile } from "../services/gateway";

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      setProfile(p);
      setLoading(false);
    })();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const next = { ...profile, ...updates };
    setProfile(next);
    await apiSaveProfile(next);
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
};
