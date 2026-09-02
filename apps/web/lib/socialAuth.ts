/**
 * Social Auth Utilities for Real Google & Facebook OAuth Pop-up Windows
 */

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
export const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "";

export interface SocialAuthResponse {
  provider: "google" | "facebook";
  idToken?: string;
  accessToken?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

/**
 * Calculates centered coordinates and opens a standard OAuth pop-up window.
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
 * Initiates a REAL Google OAuth 2.0 / OIDC pop-up flow.
 * Opens Google's account selection window and waits for token via postMessage.
 */
export function startGoogleOAuthFlow(clientId = GOOGLE_CLIENT_ID): Promise<SocialAuthResponse> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Window is undefined"));
    }

    const redirectUri = `${window.location.origin}/auth/callback`;
    const targetClientId = clientId || "324683072704-mockclientid.apps.googleusercontent.com";

    // Google OAuth 2.0 Authorization Endpoint with prompt=select_account to force account chooser
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      new URLSearchParams({
        client_id: targetClientId,
        redirect_uri: redirectUri,
        response_type: "token id_token",
        scope: "openid email profile",
        prompt: "select_account",
        nonce: `deen_${Date.now()}`,
      }).toString();

    const popup = openOAuthPopupWindow(authUrl, "Sign in with Google", 500, 620);

    if (!popup) {
      return reject(new Error("Pop-up blocked. Please allow pop-ups for this site."));
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "OAUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage);
        resolve({
          provider: "google",
          idToken: event.data.idToken,
          accessToken: event.data.accessToken,
        });
      } else if (event.data?.type === "OAUTH_ERROR") {
        window.removeEventListener("message", handleMessage);
        reject(new Error(event.data.error || "Google sign-in was cancelled or failed."));
      }
    };

    window.addEventListener("message", handleMessage);

    // Watch for manual popup close by user
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
      }
    }, 1000);
  });
}

/**
 * Initiates a REAL Facebook OAuth Login pop-up flow.
 * Opens Facebook's login dialog window and waits for access token via postMessage.
 */
export function startFacebookOAuthFlow(appId = FACEBOOK_APP_ID): Promise<SocialAuthResponse> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Window is undefined"));
    }

    const redirectUri = `${window.location.origin}/auth/callback`;
    const targetAppId = appId || "1083928172948271";

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
      new URLSearchParams({
        client_id: targetAppId,
        redirect_uri: redirectUri,
        response_type: "token",
        scope: "email,public_profile",
        auth_type: "reauthenticate",
      }).toString();

    const popup = openOAuthPopupWindow(authUrl, "Log in with Facebook", 560, 640);

    if (!popup) {
      return reject(new Error("Pop-up blocked. Please allow pop-ups for this site."));
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "OAUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage);
        resolve({
          provider: "facebook",
          accessToken: event.data.accessToken,
        });
      } else if (event.data?.type === "OAUTH_ERROR") {
        window.removeEventListener("message", handleMessage);
        reject(new Error(event.data.error || "Facebook login was cancelled or failed."));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
      }
    }, 1000);
  });
}
