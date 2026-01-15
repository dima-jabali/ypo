"use client";
import { createZustandProvider } from "./create-zustand-provider";

type ChatContextData = {
	scrollContainer: HTMLOListElement | null;
};

export const { Provider: ChatContextProvider, useStore: useChatStore } =
	createZustandProvider<ChatContextData>(
		() => ({
			scrollContainer: null,
		}),
		{
			name: "ChatContext",
		},
	);
