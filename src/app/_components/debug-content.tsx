"use client";

import { api } from "@/trpc/react";
import { env } from "@/env";

export function DebugContent() {
  const {
    data: hostnameData,
    isLoading,
    error,
  } = api.post.getHostname.useQuery(undefined, {
    // Important: Disable all caching to ensure fresh hostname on each request
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Hostname */}
      <div className="rounded-lg bg-slate-800 p-8">
        <h2 className="mb-4 text-2xl font-semibold text-purple-300">
          Server Hostname
        </h2>
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-6 w-64 rounded bg-slate-700"></div>
          </div>
        ) : error ? (
          <p className="text-xl text-red-400">
            Error loading hostname: {error.message}
          </p>
        ) : (
          <p className="text-xl">
            <span className="text-gray-300">Hostname:</span>{" "}
            <span className="font-mono text-green-400">
              {hostnameData?.hostname}
            </span>
          </p>
        )}
        <p className="mt-2 text-sm text-gray-400">
          This shows the hostname of the server/pod where this application is
          running.
          <br />
          <span className="text-yellow-400">Note:</span> Fetched fresh on each
          page load (no caching).
        </p>
      </div>

      {/* Environment Variable */}
      <div className="rounded-lg bg-slate-800 p-8">
        <h2 className="mb-4 text-2xl font-semibold text-purple-300">
          Environment Variables
        </h2>
        <p className="text-xl">
          <span className="text-gray-300">NEXT_PUBLIC_CLIENTVAR:</span>{" "}
          <span className="font-mono text-green-400">
            {env.NEXT_PUBLIC_CLIENTVAR}
          </span>
        </p>
        <p className="mt-2 text-sm text-gray-400">
          This is a client-side environment variable that can be accessed in the
          browser.
        </p>
      </div>
    </div>
  );
}
