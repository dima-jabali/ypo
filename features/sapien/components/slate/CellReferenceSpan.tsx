import { PlateElement, useElement } from "platejs/react";
import { memo, type ComponentProps } from "react";
import { useFocused, useSelected } from "slate-react";

import type { MyCellReferenceSpan } from "../../lib/plugins/CellReferencePlugin";
import { cn } from "#/helpers/class-names";

export const CellReferenceSpan = memo(
	({ children, className, ...props }: ComponentProps<typeof PlateElement>) => {
		const element = useElement<MyCellReferenceSpan>();
		const selected = useSelected();
		const focused = useFocused();

		return (
			<PlateElement
				className={cn(
					"relative inline-block text-orange-300 hover:text-orange-400 focus:text-orange-400 active:text-orange-200 underline cursor-pointer select-text [-webkit-user-modify:read-only] whitespace-pre-wrap break-words",
					selected && focused && "text-orange-400",
					className,
				)}
				data-cell-reference-span
				aria-readonly
				{...props}
				as="span"
			>
				{element.children.map((e) => e.text as string)}

				{children}
			</PlateElement>
		);
	},
);
