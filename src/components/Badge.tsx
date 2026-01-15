import { cva, type VariantProps } from "class-variance-authority";

import { classNames } from "#/helpers/class-names";

const badgeVariants = cva(
	"inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold shadow-black/40 bg-default-badge",
	{
		variants: {
			variant: {
				default: "border-transparent text-secondary shadow-sm",
				secondary:
					"border-transparent bg-secondary text-secondary hover:bg-secondary/80",
				destructive:
					"border-transparent bg-destructive text-destructive shadow-sm hover:bg-destructive/80",
				outline: "text-primary",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div
			className={classNames(badgeVariants({ variant }), className)}
			data-badge
			{...props}
		/>
	);
}
