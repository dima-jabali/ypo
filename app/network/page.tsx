"use client";

import { NetworkGraph } from "@/components/network-graph";

export default function NetworkPage() {
  return (
    <main className="container px-auto w-screen py-4 h-[calc(100vh-65px)] simple-scrollbar">
      <NetworkGraph />
    </main>
  );
}
