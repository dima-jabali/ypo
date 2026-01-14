import { SingleBlockPlugin, type Value } from "platejs";
import { ParagraphPlugin, usePlateEditor } from "platejs/react";
import { MentionInputPlugin } from "@platejs/mention/react";

import { MentionInputElement } from "./mention-input-element";
import { CellReferencePlugin } from "../../lib/plugins/CellReferencePlugin";
import { FormulaPlugin } from "../../lib/plugins/FormulaPlugin";
import { CustomMentionPlugin } from "../../lib/plugins/CustomMentionPlugin";
import { ParagraphElement } from "#/components/plate-ui/paragraph-element";

export const BATCH_TABLE_CELL_EDITOR_PLUGINS = [
	ParagraphPlugin.withComponent(ParagraphElement),

	// Custom:
	CellReferencePlugin,
	FormulaPlugin,
];

export const BATCH_TABLE_MENTION_EDITOR_PLUGINS = [
	MentionInputPlugin.withComponent(MentionInputElement),
	ParagraphPlugin.withComponent(ParagraphElement),
	SingleBlockPlugin,

	// Custom:
	CustomMentionPlugin,
];

export const useMentionInputEditor = (plateInitialValue: Value, id: string) => {
	return usePlateEditor({
		plugins: BATCH_TABLE_MENTION_EDITOR_PLUGINS,
		value: plateInitialValue,
		id,
	});
};
