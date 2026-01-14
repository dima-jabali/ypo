import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { createReactSelectors } from "../create-zustand-provider";

type AuthContext = {
	isUsingLocalClerk: boolean;
	clerkApiToken: string;
	token: string;
};

const IS_USING_LOCAL_CLERK = process.env.NEXT_PUBLIC_IS_USING_LOCAL_CLERK;

if (!IS_USING_LOCAL_CLERK) {
	throw new Error(
		"import.meta.env.VITE_PUBLIC_IS_USING_LOCAL_CLERK is not defined",
	);
}

const authStoreBase = create(
	subscribeWithSelector<AuthContext>(() => ({
		isUsingLocalClerk: IS_USING_LOCAL_CLERK === "true",
		clerkApiToken: "",
		token: "",
	})),
);

export const authStore = createReactSelectors(authStoreBase);
