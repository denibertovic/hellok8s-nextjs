"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for error parameter in URL
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setError(
        "Access denied. Only superusers can access the admin dashboard.",
      );
    } else if (errorParam === "TooManyRequests") {
      setError("Too many login attempts. Please try again in 15 minutes.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Check for specific error codes
        if (result.error === "TooManyRequests") {
          setError("Too many login attempts. Please try again in 15 minutes.");
        } else {
          setError("Invalid email or password");
        }
      } else {
        const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
        router.push(callbackUrl);
      }
    } catch (error) {
      // Handle network or other unexpected errors
      setError("An error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-600 bg-red-600/20 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
          placeholder="admin@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-800"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
