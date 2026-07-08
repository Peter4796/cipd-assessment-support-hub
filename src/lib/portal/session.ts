"use client";

/**
 * DEMO authentication only.
 *
 * This is a client-side session stub so the portal feels real — it is NOT secure
 * and must be replaced before handling real client data. For production, use a real
 * auth provider (e.g. Supabase Auth, Auth.js/Clerk) and protect /admin with server-side
 * checks or Vercel password protection.
 */

import { useSyncExternalStore } from "react";

const CLIENT_KEY = "cipd-portal-session";
const ADMIN_KEY = "cipd-admin-session";

// Demo admin passcode — change or move to a real auth flow before launch.
export const DEMO_ADMIN_CODE = "cipd-admin";

export type ClientSession = { name: string; email: string } | null;

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== "undefined") window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", cb);
  };
}

// ─── Client session ───
export function signInClient(name: string, email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLIENT_KEY, JSON.stringify({ name, email }));
  emit();
}
export function signOutClient() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CLIENT_KEY);
  emit();
}
// Cache the parsed snapshot so useSyncExternalStore gets a stable reference
// (re-parsing on every call returns a new object and causes an infinite render loop).
let clientRaw: string | null = null;
let clientCache: ClientSession = null;
function readClient(): ClientSession {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CLIENT_KEY);
  if (raw === clientRaw) return clientCache;
  clientRaw = raw;
  try {
    clientCache = raw ? (JSON.parse(raw) as ClientSession) : null;
  } catch {
    clientCache = null;
  }
  return clientCache;
}
export function useClientSession(): ClientSession {
  return useSyncExternalStore(subscribe, readClient, () => null);
}

// ─── Admin session ───
export function signInAdmin(code: string): boolean {
  if (typeof window === "undefined") return false;
  if (code.trim() !== DEMO_ADMIN_CODE) return false;
  window.localStorage.setItem(ADMIN_KEY, "1");
  emit();
  return true;
}
export function signOutAdmin() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_KEY);
  emit();
}
function readAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_KEY) === "1";
}
export function useAdminSession(): boolean {
  return useSyncExternalStore(subscribe, readAdmin, () => false);
}
