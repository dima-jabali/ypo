import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "#/helpers/class-names";

const PARAGRAPH_CLASSNAME =
	"py-1 min-h-[1lh] min-w-full only:py-2 [&_span]:text-primary!";

export function ParagraphElementForChatInput(props: PlateElementProps) {
	const isTheOnlyChildOfEditorAndIsEmpty =
		props.editor.children.length === 1 &&
		props.element.children[0]!.text === "";

	return (
		<PlateElement
			{...props}
			className={cn(props.attributes.className, PARAGRAPH_CLASSNAME)}
		>
			{isTheOnlyChildOfEditorAndIsEmpty ? (
				<span
					className="opacity-50 pointer-events-none absolute inset-0 py-2"
					contentEditable={false}
				>
					Type a question...
				</span>
			) : null}

			{props.children}
		</PlateElement>
	);
}

export function ParagraphElement(props: PlateElementProps) {
	return (
		<PlateElement {...props} className={cn("m-0 px-0 py-1 min-h-[1lh]")}>
			{props.children}
		</PlateElement>
	);
}
