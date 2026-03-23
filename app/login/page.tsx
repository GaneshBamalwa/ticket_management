"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Headset, Mail, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid credentials");
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-180px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Glow Ring */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/15 blur-sm" />

          <Card className="relative overflow-hidden border-card-border bg-background-mid/80 backdrop-blur-2xl">
            {/* Header */}
            <div className="border-b border-card-border p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                  <Headset className="h-5 w-5" />
                </div>
                <span className="font-[family-name:var(--font-syne)] text-xs font-bold uppercase tracking-widest text-white/50">
                  Support Center
                </span>
              </div>
              <h1 className="mb-1.5 font-[family-name:var(--font-syne)] text-2xl font-extrabold text-white">
                Welcome Back
              </h1>
              <p className="text-sm text-muted">Sign in to your staff portal</p>
            </div>

            {/* Form */}
            <CardContent className="pt-8">
              {error && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-danger/20 bg-danger/10 p-4 text-sm text-red-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <Input
                    label="Email Address"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="agent@support.com"
                    autoComplete="email"
                    required
                  />
                  <Mail className="pointer-events-none absolute right-3 top-[38px] h-4 w-4 text-white/20" />
                </div>

                <div className="relative">
                  <Input
                    label="Password"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-white/25 transition-colors hover:text-primary"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <p className="mt-2 text-xs italic text-muted">
                    Leave blank if you haven&apos;t set a password yet.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "SIGNING IN..." : "SIGN IN"}
                </Button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-card-border" />
                <span className="text-xs text-muted">or</span>
                <div className="h-px flex-1 bg-card-border" />
              </div>

              {/* Back Link */}
              <Link
                href="/"
                className="flex items-center justify-center gap-2 text-sm text-muted transition-colors hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to customer portal
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
