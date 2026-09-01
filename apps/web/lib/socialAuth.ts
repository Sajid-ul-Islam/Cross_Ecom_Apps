/**
 * Social Auth Utilities for Google & Facebook OAuth Pop-up Windows
 */

export interface SocialAccountProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: "google" | "facebook";
  token?: string;
}

/**
 * Calculates centered dimensions and opens a standard OAuth pop-up window.
 */
export function openOAuthPopupWindow(
  url: string,
  title = "Sign in with Social Account",
  width = 500,
  height = 620
): Window | null {
  if (typeof window === "undefined") return null;

  const dualScreenLeft = window.screenLeft ?? window.screenX;
  const dualScreenTop = window.screenTop ?? window.screenY;

  const screenWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const screenHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;

  const left = Math.max(0, screenWidth / 2 - width / 2 + dualScreenLeft);
  const top = Math.max(0, screenHeight / 2 - height / 2 + dualScreenTop);

  const newWindow = window.open(
    url,
    title,
    `scrollbars=yes,width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,toolbar=no,menubar=no`
  );

  if (newWindow && newWindow.focus) {
    newWindow.focus();
  }

  return newWindow;
}

/**
 * Loads the Google Identity Services SDK dynamically if not already on the page.
 */
export function loadGoogleIdentityServices(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).google?.accounts?.id) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.getElementById("google-gsi-client");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}
