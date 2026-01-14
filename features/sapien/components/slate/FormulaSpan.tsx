import { useFocused, useSelected } from "slate-react";
import { PlateElement, useElement } from "platejs/react";
import { memo, type ComponentProps } from "react";

import type { MyFormulaSpan } from "../../lib/plugins/FormulaPlugin";
import { cn } from "#/helpers/class-names";

export const FormulaSpan = memo(
	({ children, className, ...props }: ComponentProps<typeof PlateElement>) => {
		const element = useElement<MyFormulaSpan>();
		const selected = useSelected();
		const focused = useFocused();

		return (
			<PlateElement
				className={cn(
					"relative inline-block text-green-300 hover:text-green-400 focus:text-green-400 active:text-green-200 underline cursor-pointer select-text [-webkit-user-modify:read-only] whitespace-pre-wrap break-words",
					selected && focused && "text-green-400",
					className,
				)}
				data-formula-span
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
