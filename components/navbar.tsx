"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  Ticket,
  LayoutDashboard,
  BarChart3,
  ShieldCheck,
  LogOut,
  Users,
} from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // For now, mock user state - will be replaced with auth context
  const user = null as { name: string; role: string } | null;

  return (
    <nav className="relative z-20 w-full border-b border-card-border bg-background/85 backdrop-blur-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)] animate-pulse-dot" />
            <span className="font-[family-name:var(--font-syne)] text-sm font-extrabold tracking-widest text-white">
              SUPPORT CENTER
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-primary"
            >
              <Ticket className="h-4 w-4" />
              Raise Ticket
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-primary"
            >
              <Users className="h-4 w-4" />
              About
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-primary"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                {user.role === "Administrator" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 text-sm font-medium text-primary"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Admin Report
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent font-[family-name:var(--font-syne)] text-sm font-bold text-white">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="text-sm text-white/70">{user.name}</span>
                <span className="rounded-md border border-primary/30 bg-primary-dim px-2 py-0.5 text-xs font-medium text-primary">
                  {user.role.toUpperCase()}
                </span>
                <Link
                  href="/logout"
                  className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 font-[family-name:var(--font-syne)] text-xs font-semibold text-red-300 transition-all hover:border-danger/60 hover:bg-danger/20"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  LOGOUT
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg border border-primary/35 bg-primary-dim px-4 py-2 font-[family-name:var(--font-syne)] text-xs font-semibold tracking-wide text-primary transition-all hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_16px_var(--color-primary-glow)]"
              >
                <ShieldCheck className="h-4 w-4" />
                Staff Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-card hover:text-white md:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="border-t border-card-border bg-background/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-4 py-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-card hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <Ticket className="h-4 w-4" />
              Raise Ticket
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-card hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <Users className="h-4 w-4" />
              About
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-card hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                {user.role === "Administrator" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Admin Report
                  </Link>
                )}
              </>
            )}
            <div className="pt-3">
              {user ? (
                <Link
                  href="/logout"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 font-[family-name:var(--font-syne)] text-sm font-semibold text-red-300"
                  onClick={() => setIsOpen(false)}
                >
                  <LogOut className="h-4 w-4" />
                  LOGOUT
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/35 bg-primary-dim px-4 py-2.5 font-[family-name:var(--font-syne)] text-sm font-semibold text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Staff Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
