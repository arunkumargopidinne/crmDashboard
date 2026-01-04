"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!agree) return setError("You must accept the Terms & Conditions");
    if (password !== confirm) return setError("Passwords do not match");
    try {
      setSubmitting(true);
      await register(email, password, displayName);
      setSuccess("Registered successfully");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    try {
      setSubmitting(true);
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Google login failed");
    } finally {
      setSubmitting(false);
    }
  }

  const strength = passwordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md border rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <div className="text-2xl font-semibold">Register</div>
          <div className="text-sm text-muted-foreground">Create an account</div>
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
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            <div className="text-sm">Strength: {strength}/4</div>
          </div>

          <div className="space-y-2">
            <Label>Confirm password</Label>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
            I agree to the Terms & Conditions
          </label>

          <Button disabled={submitting} className="w-full" type="submit">
            {submitting ? "Registering..." : "Register"}
          </Button>

          <Button disabled={submitting} type="button" variant="outline" className="w-full" onClick={onGoogle}>
            Continue with Google
          </Button>
        </form>

        <div className="text-sm">
          Already have an account? {" "}
          <Link className="underline" href="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
