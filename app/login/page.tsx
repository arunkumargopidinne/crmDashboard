"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      setSubmitting(true);
      await login(email, password, remember);
      setSuccess("Logged in successfully");
      router.push(next);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setSuccess(null);
    try {
      setSubmitting(true);
      await loginWithGoogle();
      router.push(next);
    } catch (err: any) {
      setError(err?.message || "Google login failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onForgot() {
    try {
      const auth = (await import("@/app/lib/firebase")).getFirebaseAuth();
      if (!auth) throw new Error("Firebase is not configured");
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent");
    } catch (err: any) {
      setError(err?.message || "Failed to send reset email");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md border rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <div className="text-2xl font-semibold">Brand / Logo</div>
          <div className="text-sm text-muted-foreground">Login to your account</div>
        </div>

        {error && (
          <Alert>
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <div className="flex gap-2">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={show ? "text" : "password"}
                required
              />
              <Button type="button" variant="outline" onClick={() => setShow((s) => !s)}>
                {show ? "Hide" : "Show"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
              Remember me
            </label>

            <button type="button" className="text-sm underline" onClick={onForgot}>
              Forgot password?
            </button>
          </div>

          <Button disabled={submitting} className="w-full" type="submit">
            {submitting ? "Logging in..." : "Login"}
          </Button>

          <Button disabled={submitting} type="button" variant="outline" className="w-full" onClick={onGoogle}>
            Continue with Google
          </Button>
        </form>

        <div className="text-sm">
          Don&apos;t have an account? {" "}
          <Link className="underline" href="/register">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
