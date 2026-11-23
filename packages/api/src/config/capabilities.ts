import { apiMode } from "../mocks/mode";

export interface AuthCapabilities {
  emailOtp: boolean;
  refreshCookie: boolean;
  studentProfileFields: boolean;
  publicCatalog: boolean;
  deviceChangeRequest: boolean;
}

function resolveCapability(value: string | undefined, defaultValue: boolean): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
}

const modeDefault = apiMode === "mock";

/** Exposes target-auth capabilities with safe current-backend defaults and public Vite overrides. */
export const capabilities: AuthCapabilities = {
  emailOtp: resolveCapability(import.meta.env.VITE_AUTH_CAP_EMAIL_OTP, modeDefault),
  refreshCookie: resolveCapability(import.meta.env.VITE_AUTH_CAP_REFRESH_COOKIE, modeDefault),
  studentProfileFields: resolveCapability(
    import.meta.env.VITE_AUTH_CAP_STUDENT_PROFILE_FIELDS,
    modeDefault,
  ),
  publicCatalog: resolveCapability(import.meta.env.VITE_AUTH_CAP_PUBLIC_CATALOG, modeDefault),
  deviceChangeRequest: resolveCapability(
    import.meta.env.VITE_AUTH_CAP_DEVICE_CHANGE_REQUEST,
    modeDefault,
  ),
};
