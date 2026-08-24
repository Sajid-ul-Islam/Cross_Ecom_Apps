import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchStoreInfo, StoreInfo, fetchPage } from "../services/gateway";

const DEFAULTS: StoreInfo = {
  address: "Level 3, Ramzannesa Super Market, Mirpur 12, Dhaka 1216",
  city: "Dhaka",
  postcode: "1216",
  country: "BD",
  currency: "BDT",
  hotline: "09617-700500",
  whatsapp: "01952-700500",
  bkash: "01952700500",
  email: "support@deencommerce.com",
};

interface StoreContextType {
  info: StoreInfo;
  /** Fetch a WordPress page (About / Return / Terms / Contact) from the gateway. */
  getPage: (slug: string) => Promise<{ title: string; content: string } | null>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [info, setInfo] = useState<StoreInfo>(DEFAULTS);

  useEffect(() => {
    fetchStoreInfo()
      .then((s) => { if (s) setInfo(s); })
      .catch(() => {});
  }, []);

  return (
    <StoreContext.Provider value={{ info, getPage: fetchPage }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};
