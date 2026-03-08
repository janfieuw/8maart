export const DEVICE_TOKEN_STORAGE_KEY = "punctoo_device_token";

export function generateDeviceToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateDeviceToken() {
  if (typeof window === "undefined") return "";

  let token = window.localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);

  if (!token) {
    token = generateDeviceToken();
    window.localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, token);
  }

  return token;
}

export function clearDeviceToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEVICE_TOKEN_STORAGE_KEY);
}