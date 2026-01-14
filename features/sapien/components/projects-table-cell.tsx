import { type ComponentProps } from "react";

type Props = ComponentProps<"td">;

export function ProjectsTableCell({ className = "", ...rest }: Props) {
	return (
		<td
			className={`min-w-[4rem] max-w-[30rem] whitespace-nowrap border-accent first-of-type:min-w-16 ${className}`}
			{...rest}
		/>
	);
}
