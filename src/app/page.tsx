import { LatestPosts } from "@/app/_components/latest-posts";
import { HydrateClient } from "@/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        {/* GitHub Link */}
        <div className="absolute top-4 right-4">
          <a
            href="https://github.com/denibertovic/hellok8s-nextjs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View on GitHub
          </a>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Header Section */}
          <div className="mb-16 text-center">
            <h1 className="mb-6 text-6xl font-bold">
              hellok8s<span className="text-purple-300">-nextjs</span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-200">
              Self-hosted Next.js demo, showcasing Docker containerization,
              Kubernetes deployment, and complete application lifecycle.
            </p>
          </div>

          {/* Features Grid */}
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-800 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500">
                <i className="fa fa-laptop-code text-2xl text-white"></i>
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Development environment
              </h3>
              <p className="text-sm text-gray-300">
                Easy, single command (devenv up) development environment powered
                by{" "}
                <a
                  href="https://nixos.org"
                  className="text-purple-300 hover:text-purple-200"
                >
                  Nix
                </a>{" "}
                and{" "}
                <a
                  href="https://devenv.sh"
                  className="text-purple-300 hover:text-purple-200"
                >
                  devenv.
                </a>
              </p>
            </div>

            <div className="rounded-lg bg-slate-800 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500">
                <i className="fab fa-docker text-2xl text-white"></i>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Containerized</h3>
              <p className="text-sm text-gray-300">
                Docker-powered Next.js application with optimized builds using
                modern JavaScript tooling.
              </p>
            </div>

            <div className="rounded-lg bg-slate-800 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500">
                <i className="fas fa-dharmachakra text-2xl text-white"></i>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Kubernetes</h3>
              <p className="text-sm text-gray-300">
                Fully automated CI/CD pipeline with Github actions.
              </p>
            </div>

            <div className="rounded-lg bg-slate-800 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500">
                <i className="fas fa-check-circle text-2xl text-white"></i>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Production Ready</h3>
              <p className="text-sm text-gray-300">
                Auth.js authentication with built in rate limiting, Automated
                database migrations, Secure secrets management. Easy rollbacks.
              </p>
            </div>
          </div>

          {/* Latest Posts Section */}
          <LatestPosts />
        </div>
      </main>
    </HydrateClient>
  );
}
