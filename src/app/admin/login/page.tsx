"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInAdmin, DEMO_ADMIN_CODE } from "@/lib/portal/session";
import { Icon } from "@/components/Icon";

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signInAdmin(code)) {
      router.push("/admin");
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Image src="/logo.png" alt="CIPD Guidance" width={40} height={40} className="h-10 w-10 rounded-xl" />
          <span className="text-lg font-bold text-navy-900">CIPD Guidance</span>
        </Link>

        <div className="rounded-3xl border border-mist-200 bg-white p-8 shadow-card">
          <h1 className="text-2xl font-bold text-navy-900">Admin sign in</h1>
          <p className="mt-1 text-sm text-navy-600">Enter the admin passcode to manage enquiries.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor="code">Passcode</label>
              <input
                id="code"
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                  error ? "border-red-400 focus:ring-red-200" : "border-mist-300 focus:border-teal-500 focus:ring-teal-500/20"
                }`}
                placeholder="Enter passcode"
                required
              />
              {error && <p className="mt-1.5 text-xs text-red-600">Incorrect passcode. Try again.</p>}
            </div>
            <button type="submit" className="btn-navy w-full">
              Sign in <Icon name="arrow" className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-gold-200 bg-gold-50 p-3 text-center text-xs text-navy-600">
            Demo passcode: <span className="font-mono font-semibold text-navy-900">{DEMO_ADMIN_CODE}</span>
            <br />Replace with real authentication before handling live data.
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-navy-500">
          Not an admin?{" "}
          <Link href="/portal/login" className="font-semibold text-navy-700 hover:text-gold-600">
            Client sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
