import { createZustandProvider } from "#/contexts/create-zustand-provider";
import type { BatchTableColumn } from "#/types/batch-table";

type MentionablesContextType = {
	mentionables: Array<BatchTableColumn>;
	isPopoverOpen: boolean;
};

export const {
	Provider: MentionablesProvider,
	useStore: useMentionablesStore,
} = createZustandProvider<MentionablesContextType>(
	() => ({
		isPopoverOpen: false,
		mentionables: [],
	}),
	{ name: "MentionablesProvider" },
);
