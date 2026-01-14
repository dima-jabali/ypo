import type { TMentionElement } from "platejs";
import { IS_APPLE, KEYS } from "platejs";
import { Fragment } from "react";
import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "#/helpers/class-names";

export function MentionElement(
	props: SlateElementProps<TMentionElement> & {
		prefix?: string;
	},
) {
	const { prefix } = props;
	const element = props.element;

	return (
		<SlateElement
			{...props}
			className={cn(
				"inline-block rounded-sm bg-mention text-black px-1.5 py-0.5 align-baseline text-sm font-medium",
				element.children[0]?.[KEYS.bold] === true && "font-bold",
				element.children[0]?.[KEYS.italic] === true && "italic",
				element.children[0]?.[KEYS.underline] === true && "underline",
			)}
			attributes={{
				...props.attributes,
				"data-slate-value": element.value,
			}}
		>
			{IS_APPLE ? (
				// Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
				<Fragment>
					{props.children}
					{prefix}
					{element.value}
				</Fragment>
			) : (
				// Others like Android https://github.com/ianstormtaylor/slate/pull/5360
				<Fragment>
					{prefix}
					{element.value}
					{props.children}
				</Fragment>
			)}
		</SlateElement>
	);
}
