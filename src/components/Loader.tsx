import { classNames } from "#/helpers/class-names";

type Props = {
	className?: string;
};

export const Loader = ({ className = "" }: Props) => (
	<span
		className={classNames(
			"aspect-square size-4 flex-none animate-spin rounded-full border-2 border-transparent border-t-primary duration-500",
			className,
		)}
	/>
);
