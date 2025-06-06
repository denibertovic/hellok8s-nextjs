"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { env } from "@/env";

export function HostnameButton() {
  const [showHostname, setShowHostname] = useState(false);
  const [showEnvVar, setShowEnvVar] = useState(false);
  const {
    data: hostnameData,
    isFetching,
    refetch,
  } = api.post.getHostname.useQuery(undefined, {
    enabled: false,
    staleTime: 0,
    gcTime: 0,
  });

  const handleHostnameClick = () => {
    setShowHostname(true);
    void refetch();
  };

  const handleEnvVarClick = () => {
    setShowEnvVar(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleHostnameClick}
        className="rounded-lg border-2 border-gray-600 bg-gradient-to-b from-gray-800 to-gray-900 px-6 py-3 font-semibold text-white shadow-lg transition hover:border-gray-500 hover:from-gray-700 hover:to-gray-800 disabled:opacity-50"
        disabled={isFetching}
      >
        {isFetching ? "Getting hostname..." : "What's your hostname?"}
      </button>
      {showHostname && hostnameData && (
        <p className="text-xl text-white">
          Hostname: <span className="font-mono">{hostnameData.hostname}</span>
        </p>
      )}

      <button
        onClick={handleEnvVarClick}
        className="rounded-lg border-2 border-gray-600 bg-gradient-to-b from-gray-800 to-gray-900 px-6 py-3 font-semibold text-white shadow-lg transition hover:border-gray-500 hover:from-gray-700 hover:to-gray-800 disabled:opacity-50"
      >
        Show NEXT_PUBLIC_CLIENTVAR
      </button>
      {showEnvVar && (
        <p className="text-xl text-white">
          NEXT_PUBLIC_CLIENTVAR:{" "}
          <span className="font-mono">{env.NEXT_PUBLIC_CLIENTVAR}</span>
        </p>
      )}
    </div>
  );
}
