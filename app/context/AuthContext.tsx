"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth } from "@/app/lib/firebase";
import { apiFetch } from "@/app/lib/api";

type User = any;

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: any) => Promise<User>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        setLoading(true);
        if (fbUser) {
          // fetch Mongo profile
          await fbUser.getIdToken();
          const data = await apiFetch("/api/auth/me");
          const merged = { ...(fbUser as any), ...(data?.user || {}) };
          setUser(merged);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  async function login(email: string, password: string, remember = false) {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    const res = await signInWithEmailAndPassword(auth, email, password);
    await apiFetch("/api/auth/sync", { method: "POST" });
    const data = await apiFetch("/api/auth/me");
    const merged = { ...(res.user as any), ...(data?.user || {}) };
    setUser(merged);
  }

  async function register(email: string, password: string, displayName?: string) {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await firebaseUpdateProfile(res.user, { displayName });
    }
    await apiFetch("/api/auth/sync", { method: "POST" });
    const data = await apiFetch("/api/auth/me");
    const merged = { ...(res.user as any), ...(data?.user || {}) };
    setUser(merged);
  }

  async function loginWithGoogle() {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    await apiFetch("/api/auth/sync", { method: "POST" });
    const data = await apiFetch("/api/auth/me");
    const merged = { ...(res.user as any), ...(data?.user || {}) };
    setUser(merged);
  }

  async function logout() {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
    setUser(null);
  }

  async function updateProfile(updates: any) {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error("No user");
    // update firebase profile where appropriate
    if (updates.displayName || updates.photoURL) {
      await firebaseUpdateProfile(fbUser as FirebaseUser, {
        displayName: updates.displayName ?? fbUser.displayName,
        photoURL: updates.photoURL ?? (fbUser as any).photoURL,
      });
    }
    // update mongodb via API
    const updated = await apiFetch("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    const merged = { ...(fbUser as any), ...(updated?.user || {}) };
    setUser(merged);
    return merged;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
