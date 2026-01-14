import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { classNames } from "#/helpers/class-names";
import { Loader } from "#/components/Loader";

const ButtonVariants = cva(
	"inline-flex items-center justify-center rounded-md text-sm font-medium aria-disabled:brightness-75 disabled:brightness-70 gap-3 flex-none aria-disabled:cursor-not-allowed",
	{
		variants: {
			variant: {
				success:
					"text-green-foreground bg-green-700 hover:bg-green-600 active:bg-green-800 text-white",
				default: "text-secondary bg-primary button-hover hover:text-primary",
				destructive: "bg-red-700 hover:bg-red-600 active:bg-red-800 text-white",
				outline:
					"border border-border-smooth  bg-popover hover:bg-accent hover:text-white",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost: "button-hover border border-none hover:text-primary",
				link: "text-primary underline-offset-4 hover:underline",
				purple:
					"items-center bg-accent py-1 active:bg-[hsl(251,93%,57%)] hover:opacity-80 text-white",
			},
			size: {
				lg: "h-11 rounded-md px-8",
				default: "h-10 px-3 py-2",
				sm: "h-9 rounded-md px-3",
				xs: "h-6 rounded-[10px]",
				icon: "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

// eslint-disable-next-line react-refresh/only-export-components
export enum ButtonVariant {
	DESTRUCTIVE = "destructive",
	SECONDARY = "secondary",
	DEFAULT = "default",
	OUTLINE = "outline",
	SUCCESS = "success",
	PURPLE = "purple",
	GHOST = "ghost",
	LINK = "link",
}

export interface ButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof ButtonVariants> {
	loaderClassNames?: string;
	icon?: React.ReactNode;
	isLoading?: boolean;
	asChild?: boolean;
}

export const LOADER = <Loader className="size-4 flex-none border-t-primary" />;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			loaderClassNames,
			asChild = false,
			isLoading,
			className,
			children,
			variant,
			size,
			icon,
			...props
		},
		ref,
	) => {
		const Component = asChild ? SlotPrimitive.Slot : "button";

		return (
			<Component
				className={classNames(ButtonVariants({ variant, size, className }))}
				aria-disabled={props.disabled || isLoading}
				data-is-loading={isLoading}
				type="button"
				ref={ref}
				{...props}
			>
				{isLoading ? (
					<Loader
						className={classNames(
							"size-4 flex-none border-t-white",
							loaderClassNames,
						)}
					/>
				) : (
					icon
				)}

				{children}
			</Component>
		);
	},
);

Button.displayName = "Button";

export { Button, ButtonVariants };
