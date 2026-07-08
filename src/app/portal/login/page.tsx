"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInClient } from "@/lib/portal/session";
import { Icon } from "@/components/Icon";

export default function PortalLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    signInClient(name || "Guest", email || "guest@example.com");
    router.push("/portal");
  };

  const fillDemo = () => {
    signInClient("Amira Hassan", "amira.h@example.com");
    router.push("/portal");
  };

  const inputCls =
    "w-full rounded-xl border border-mist-300 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-gold-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
              <path d="M6 10v5c0 1.3 2.7 3 6 3s6-1.7 6-3v-5" />
            </svg>
          </span>
          <span className="text-lg font-bold text-navy-900">CIPD Support Hub</span>
        </Link>

        <div className="rounded-3xl border border-mist-200 bg-white p-8 shadow-card">
          <h1 className="text-2xl font-bold text-navy-900">Client portal</h1>
          <p className="mt-1 text-sm text-navy-600">
            Sign in to submit requests, track progress and download your work.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor="name">Name</label>
              <input id="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor="email">Email</label>
              <input id="email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <button type="submit" className="btn-primary w-full">
              Sign in <Icon name="arrow" className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-center">
            <p className="text-xs text-navy-600">Just exploring?</p>
            <button onClick={fillDemo} className="mt-1 text-sm font-semibold text-teal-700 hover:text-teal-800">
              Enter the demo as a sample client →
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-navy-400">
            Demo sign-in — no password required. Real accounts &amp; security are added when the
            live backend is connected.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-navy-500">
          Are you an administrator?{" "}
          <Link href="/admin/login" className="font-semibold text-navy-700 hover:text-gold-600">
            Admin sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
