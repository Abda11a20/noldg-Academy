export interface SessionData {
  accessToken: string;
}

export interface TokenStore {
  getAccessToken(): string | null;
  setSession(session: SessionData): void;
  clear(): void;
  refresh(): Promise<string | null>;
}

type RefreshHandler = () => Promise<string | null>;

const sessionStorageKey = "noldg:access-token";
let refreshHandler: RefreshHandler | undefined;
let memoryAccessToken: string | null = null;

/** Registers the HTTP refresh-cookie flow used by both token store modes. */
export function setRefreshHandler(handler: RefreshHandler): void {
  refreshHandler = handler;
}

const memoryStore: TokenStore = {
  getAccessToken() {
    return memoryAccessToken;
  },
  setSession(session) {
    memoryAccessToken = session.accessToken;
  },
  clear() {
    memoryAccessToken = null;
  },
  async refresh() {
    return refreshHandler?.() ?? null;
  },
};

const sessionStore: TokenStore = {
  getAccessToken() {
    try {
      return sessionStorage.getItem(sessionStorageKey);
    } catch {
      return memoryStore.getAccessToken();
    }
  },
  setSession(session) {
    try {
      sessionStorage.setItem(sessionStorageKey, session.accessToken);
    } catch {
      memoryStore.setSession(session);
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(sessionStorageKey);
    } catch {
      memoryStore.clear();
    }
  },
  async refresh() {
    return refreshHandler?.() ?? null;
  },
};

/** Active token storage; sessionStorage is an explicit temporary compatibility fallback. */
export const tokenStore: TokenStore =
  import.meta.env.VITE_AUTH_STORAGE === "session" ? sessionStore : memoryStore;
