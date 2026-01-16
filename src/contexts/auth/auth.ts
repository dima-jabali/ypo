"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { createReactSelectors } from "../create-zustand-provider";

type AuthContext = {
  isUsingLocalClerk: boolean;
  clerkApiToken: string;
  token: string;
};

const authStoreBase = create(
  subscribeWithSelector<AuthContext>(() => ({
    isUsingLocalClerk: true,
    clerkApiToken: "",
    token: "",
  })),
);

export const authStore = createReactSelectors(authStoreBase);
