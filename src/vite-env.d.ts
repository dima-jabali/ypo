/// <reference types="vite/client" />

import { BrowserClerk } from "@clerk/nextjs";

declare global {
  type TODO = unknown;

  interface Window {
    SHOULD_LOG: boolean;
    Clerk: BrowserClerk;
  }
}
