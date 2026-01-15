import { Tooltip as TooltipPrimitive } from "radix-ui";

import { classNames } from "../helpers/class-names";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = ({
	className,
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) => (
	<TooltipPrimitive.Portal>
		<TooltipPrimitive.Content
			sideOffset={sideOffset}
			className={classNames(
				"z-200 overflow-hidden rounded-md border border-border-smooth bg-popover px-3 py-1.5 text-sm text-primary shadow-md",
				className,
			)}
			{...props}
		/>
	</TooltipPrimitive.Portal>
);

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
