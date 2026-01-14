import { MentionPlugin } from "@platejs/mention/react";

import { MentionElement } from "../../components/mention-input/mention-element";

export const CustomMentionPlugin = MentionPlugin.configure({
	node: {
		component: MentionElement,
	},
	options: {
		triggerPreviousCharPattern: /^\s?$/,
		insertSpaceAfterMention: true,
		trigger: "@",
	},
});
