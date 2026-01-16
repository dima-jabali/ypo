"use client";

import { createContext, useContext } from "react";
import type { ActorRefFrom } from "xstate";

import type { websocketStateMachine } from "./websocket-state-machine";
import type { FileId } from "#/types/general";

export type WebsocketContextType = {
  actorRef: ActorRefFrom<typeof websocketStateMachine>;
  tryToSubscribeToFileUpdates(fileId: FileId): void;
};

export const WebsocketContext = createContext<WebsocketContextType | null>(null);

export const useWebsocketStore = () => {
  const context = useContext(WebsocketContext);

  if (!context) {
    throw new Error("useWebsocketStore must be used within a WebsocketProvider");
  }

  return context;
};
