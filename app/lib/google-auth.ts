/**
 * Browser-only OAuth via Google Identity Services (token model / implicit flow).
 * No client secret, no backend — the SPA holds a short-lived access token.
 */

export const CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const STORAGE_KEY = "gcal.token";

const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** `undefined` unless a real client ID was configured (the .env.example placeholder doesn't count). */
export const CLIENT_ID =
  rawClientId && !rawClientId.startsWith("your-client-id")
    ? rawClientId
    : undefined;

export type StoredToken = {
  accessToken: string;
  /** epoch ms */
  expiresAt: number;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: string | number;
  error?: string;
  error_description?: string;
};

type TokenClient = {
  callback: (response: TokenResponse) => void;
  requestAccessToken: (overrides?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: ((response: TokenResponse) => void) | "";
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => TokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

let gsiPromise: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (gsiPromise) return gsiPromise;

  gsiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`,
    );
    if (existing) {
      if (window.google?.accounts?.oauth2) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Identity Services")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });

  return gsiPromise;
}

let tokenClient: TokenClient | null = null;

async function getTokenClient(): Promise<TokenClient> {
  if (!CLIENT_ID) {
    throw new Error(
      "Missing VITE_GOOGLE_CLIENT_ID — copy .env.example to .env and add your OAuth client ID.",
    );
  }
  await loadGsi();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error("Google Identity Services unavailable");

  if (!tokenClient) {
    tokenClient = oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: CALENDAR_SCOPE,
      callback: "", // assigned per request below
    });
  }
  return tokenClient;
}

/** Opens the Google consent popup. Must be called from a user gesture. */
export async function requestAccessToken(): Promise<StoredToken> {
  const client = await getTokenClient();

  return new Promise<StoredToken>((resolve, reject) => {
    client.callback = (response) => {
      if (response.error || !response.access_token) {
        reject(
          new Error(
            response.error_description ??
              response.error ??
              "Authorization failed",
          ),
        );
        return;
      }
      const expiresIn = Number(response.expires_in ?? 3600);
      const token: StoredToken = {
        accessToken: response.access_token,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      saveToken(token);
      resolve(token);
    };

    client.requestAccessToken({ prompt: hasStoredToken() ? "" : "consent" });
  });
}

export function revokeAccessToken(token: string) {
  clearToken();
  window.google?.accounts?.oauth2?.revoke?.(token);
}

/** Treat a token as dead 60s early so an in-flight request can't expire mid-air. */
export function isExpired(token: StoredToken) {
  return token.expiresAt - 60_000 <= Date.now();
}

export function loadToken(): StoredToken | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const token = JSON.parse(raw) as StoredToken;
    if (!token?.accessToken || isExpired(token)) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

function hasStoredToken() {
  return typeof window !== "undefined" && !!window.localStorage.getItem("gcal.connected");
}

function saveToken(token: StoredToken) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(token));
  // Remembers that consent was granted before, so re-auth can skip the prompt.
  window.localStorage.setItem("gcal.connected", "1");
}

export function clearToken() {
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem("gcal.connected");
}
