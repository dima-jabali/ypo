import { Editor } from "@monaco-editor/react";
import { Resizable } from "re-resizable";
import { memo } from "react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import {
	MONACO_EDITOR_OPTIONS,
	MONACO_EDITOR_RESIZER_ENABLE_CONTAINER,
} from "#/helpers/monaco-editor";
import { CopyButton } from "./copy-button";
import { ColorScheme } from "#/types/general";

const READONLY_MONACO_EDITOR_OPTIONS: typeof MONACO_EDITOR_OPTIONS = {
	...MONACO_EDITOR_OPTIONS,
	readOnly: true,
};

const HANDLE_CLASSES_CONTAINER = {
	bottom:
		"bg-white/10 rounded-full hover:bg-white/20 active:bg-white/30 h-1.5! w-32! left-[calc(50%-64px)]! -bottom-2.5! pointer-events-auto",
};

type Props = { text: string; lang: string };

export const CodeBlock = memo(function CodeBlock({ text, lang }: Props) {
	const colorScheme = generalContextStore.use.colorScheme();

	return (
		<div
			className="my-4 flex flex-col border rounded-t-md border-muted-strong w-full max-w-full"
			data-markdown-code-block-lang={lang}
		>
			<header className="bg-muted-strong p-0.5 text-xs flex items-center justify-between">
				<span
					className="text-primary font-mono font-semibold pl-2 capitalize"
					title="Programming Language"
				>
					{lang}
				</span>

				<CopyButton text={text} />
			</header>

			<Resizable
				className="flex flex-col overflow-visible relative"
				enable={MONACO_EDITOR_RESIZER_ENABLE_CONTAINER}
				handleClasses={HANDLE_CLASSES_CONTAINER}
				minHeight="208px"
				minWidth="90%"
			>
				<Editor
					theme={colorScheme === ColorScheme.dark ? "vs-dark" : "vs-light"}
					className="h-full min-h-52 w-full min-w-full"
					options={READONLY_MONACO_EDITOR_OPTIONS}
					language={lang || "plaintext"}
					value={text}
					key={lang}
				/>
			</Resizable>
		</div>
	);
});
