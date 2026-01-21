"use client";

import { WithOrganizationIdAndListBoundary } from "#/components/with-organization-id-and-list-boundary";
import { ChatOrNotebook } from "#/views/chat-or-notebook";

export default function SearchPage() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    <div className="relative w-screen max-h-[calc(100vh-65px)] h-[calc(100vh-65px)] overflow-hidden flex flex-col items-center justify-center">
      <WithOrganizationIdAndListBoundary failedText="Something went wrong at the main page!">
        <ChatOrNotebook />
      </WithOrganizationIdAndListBoundary>
    </div>
  );
}
