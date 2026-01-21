import type { Metadata } from "next";
import { Suspense } from "react";
import type React from "react";

import { Providers } from "@/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "YPO Unified Member Brain - Demo",
  description:
    "Intelligent platform powering world-class member connection, search, and AI experiences for 38,000 global executives",
  icons: {
    icon: [
      {
        url: "/ypo-favicon.png",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body className="font-sans antialiased overflow-hidden h-screen w-screen">
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
