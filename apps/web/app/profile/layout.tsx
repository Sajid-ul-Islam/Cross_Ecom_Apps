import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'My Profile | DEEN',
  robots: 'noindex, nofollow'
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
