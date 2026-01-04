"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/app/lib/firebase";
import { apiFetch } from "@/app/lib/api";

import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await apiFetch("/api/auth/me");
        if (mounted) setUser(data.user || data);
      } catch (err: any) {
        setError(err?.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSignOut() {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    // redirect to login
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl border rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={handleSignOut}>Sign out</Button>
            <Link className="underline" href="/register">
              Register
            </Link>
          </div>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {user && (
          <div>
            <div className="text-lg">Welcome, {user.displayName || user.email}</div>
            {user.photoURL && <img src={user.photoURL} alt="avatar" className="w-24 h-24 rounded" />}
            <pre className="mt-4 bg-gray-100 p-4 rounded">{JSON.stringify(user, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
