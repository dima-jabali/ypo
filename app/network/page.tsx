"use client";

import { NetworkGraph } from "@/components/network-graph";

export default function NetworkPage() {
  return (
    <div className="flex flex-col items-center justify-center simple-scrollbar h-[calc(100vh-65px)] w-screen">
      <main className="flex flex-col gap-8 h-full container mx-auto">
        <div className="flex flex-none size-0"></div>

        <NetworkGraph />

        <div className="flex flex-none size-[1px]"></div>
      </main>
    </div>
  );
}
