import { HostnameButton } from "@/app/_components/hostname";
import { HydrateClient } from "@/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            Hello from k8s
          </h1>
          <HostnameButton />
        </div>
      </main>
    </HydrateClient>
  );
}
