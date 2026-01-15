import {
	BlockquotePlugin,
	BoldPlugin,
	HorizontalRulePlugin,
	ItalicPlugin,
	StrikethroughPlugin,
} from "@platejs/basic-nodes/react";
import { IndentPlugin } from "@platejs/indent/react";
import { ListPlugin } from "@platejs/list/react";
import { MarkdownPlugin } from "@platejs/markdown";
import { ImagePlugin } from "@platejs/media/react";
import { BlockSelectionPlugin } from "@platejs/selection/react";
import { TabbablePlugin } from "@platejs/tabbable/react";
import {
	DebugPlugin,
	KEYS,
	NodeIdPlugin,
	NormalizeTypesPlugin,
	TrailingBlockPlugin,
} from "platejs";
import { ParagraphPlugin } from "platejs/react";

import { ParagraphElementForChatInput } from "#/components/plate-ui/paragraph-element";
import { functionThatReturnsTrue, isDev } from "#/helpers/utils";
import { CustomImageElement } from "../custom-plate-ui/custom-image-element";
import { AutoformatKit } from "../plate-ui/autoformat";
import { BlockList } from "../plate-ui/block-list";
import { BlockSelection } from "../plate-ui/block-selection";
import { BlockquoteElement } from "../plate-ui/blockquote-element";
import { HrElement } from "../plate-ui/hr-element";

export const messageInputPlugins = [
	BlockSelectionPlugin.configure({
		shortcuts: {
			selectAll: {
				keys: "mod+a",
				handler(ctx) {
					if (
						!ctx.editor.tf.selectAll() &&
						"blockSelection" in ctx.editor.api
					) {
						// @ts-expect-error => ignore
						ctx.editor.api.blockSelection.selectAll();
					}
				},
			},
		},
		options: {
			isSelectable: functionThatReturnsTrue,
			enableContextMenu: true,
		},
		render: {
			belowRootNodes: () => <BlockSelection />,
		},
	}),

	NormalizeTypesPlugin,
	TabbablePlugin,
	MarkdownPlugin,
	ItalicPlugin,
	NodeIdPlugin,
	BoldPlugin,

	ParagraphPlugin.withComponent(ParagraphElementForChatInput),
	ImagePlugin.withComponent(CustomImageElement),
	HorizontalRulePlugin.withComponent(HrElement),

	...AutoformatKit,

	IndentPlugin.configure({
		inject: {
			targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock],
		},
	}),
	ListPlugin.configure({
		inject: {
			targetPlugins: [
				...KEYS.heading,
				KEYS.blockquote,
				KEYS.codeBlock,
				KEYS.toggle,
				KEYS.p,
			],
		},
		render: {
			belowNodes: BlockList,
		},
	}),
	StrikethroughPlugin.configure({
		shortcuts: { toggle: { keys: "mod+shift+x" } },
	}),
	BlockquotePlugin.configure({
		shortcuts: { toggle: { keys: "mod+shift+period" } },
		node: { component: BlockquoteElement },
	}),
	TrailingBlockPlugin.configure({
		options: { type: ParagraphPlugin.key },
	}),

	DebugPlugin.configure({
		options: {
			isProduction: !isDev,
			logLevel: "log",
		},
	}),
];
