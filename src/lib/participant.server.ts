import { deleteCookie, getCookie, getRequestUrl, setCookie, setResponseHeader } from "@tanstack/react-start/server";
import { SESSION_SECONDS } from "./participant";

const cookieName = "kiu_participant";
export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
export function createToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("");
}
export function privateResponse() { setResponseHeader("Cache-Control", "no-store, private"); }
export function sessionToken() { return getCookie(cookieName); }
export async function requireSessionHash() {
  privateResponse();
  const token = sessionToken();
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new Error("Your session has ended. Please log in again.");
  return hashToken(token);
}
export function writeSession(token: string) {
  privateResponse();
  setCookie(cookieName, token, { httpOnly: true, secure: getRequestUrl().protocol === "https:", sameSite: "lax", path: "/", maxAge: SESSION_SECONDS });
}
export function clearSession() {
  privateResponse();
  deleteCookie(cookieName, { path: "/" });
}