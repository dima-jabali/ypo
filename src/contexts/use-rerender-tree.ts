"use client";
import { createUUID } from "#/helpers/utils";
import { createZustandProvider } from "./create-zustand-provider";

type RerenderTreeStore = {
  rerenderTree: () => void;
  key: string;
};

export const { Provider: RerenderTreeProvider, useStore: useRerenderTreeStore } =
  createZustandProvider<RerenderTreeStore>(
    (_get, set) => ({
      rerenderTree: () => set({ key: createUUID() }),
      key: "",
    }),
    { name: "RerenderTreeProvider" },
  );
