"use client";

export const APP_TOAST_EVENT = "opryn:toast";
export const APP_TOAST_KEY = "opryn:pending-toast";

export type AppToastMessage = {
  id: number;
  title: string;
  description?: string;
};

export function showAppToast(title: string, description?: string) {
  const message: AppToastMessage = {
    id: Date.now(),
    title,
    description,
  };
  window.sessionStorage.setItem(APP_TOAST_KEY, JSON.stringify(message));
  window.dispatchEvent(new CustomEvent(APP_TOAST_EVENT));
}

export function readAppToast() {
  const raw = window.sessionStorage.getItem(APP_TOAST_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(APP_TOAST_KEY);
  try {
    return JSON.parse(raw) as AppToastMessage;
  } catch {
    return null;
  }
}
