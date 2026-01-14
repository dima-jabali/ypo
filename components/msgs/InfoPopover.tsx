import type { PropsWithChildren } from "react";
import { ChevronRightIcon, Info } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "../Popover";
import { stopPropagation } from "#/helpers/utils";

type ReasongingProps = {
	reasoning: React.ReactNode;
	defaultOpen: boolean;
	onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

type InfoProps = {
	defaultOpen: boolean;
};

export const ReasoningPopover: React.FC<ReasongingProps> = ({
	reasoning,
	defaultOpen,
}) => {
	return (
		<Popover defaultOpen={defaultOpen}>
			<PopoverTrigger
				className="my-auto ml-2 flex size-5 h-fit items-center justify-center rounded-full button-hover"
				onClick={stopPropagation}
				title="Reasoning"
			>
				<Info className="size-5" />
			</PopoverTrigger>

			<PopoverContent
				className="simple-scrollbar z-10 flex max-h-[20vh] min-w-60 max-w-md flex-col p-4 shadow-2xl scrollbar-width-2"
				sideOffset={5}
				align="center"
				side="top"
			>
				<p className="break-words text-sm leading-5 text-primary">
					{reasoning}
				</p>
			</PopoverContent>
		</Popover>
	);
};

export const InfoPopover: React.FC<PropsWithChildren<InfoProps>> = ({
	children,
	defaultOpen,
}) => {
	return (
		<Popover defaultOpen={defaultOpen}>
			<PopoverTrigger
				className="my-auto flex size-4 h-fit items-center justify-center rounded-full button-hover"
				onClick={stopPropagation}
				title="Information"
			>
				<Info className="size-5" />
			</PopoverTrigger>

			<PopoverContent
				className="simple-scrollbar z-20 flex max-h-[20vh] min-w-60 max-w-md flex-col p-4 scrollbar-width-2"
				sideOffset={5}
				align="end"
				side="top"
			>
				{children}
			</PopoverContent>
		</Popover>
	);
};

export const ExtraInfoPopover: React.FC<ReasongingProps> = ({
	reasoning,
	defaultOpen,
}) => {
	return (
		<Popover defaultOpen={defaultOpen}>
			<PopoverTrigger
				className="my-auto mr-2 flex size-5 h-fit items-center justify-center rounded-full data-[state=open]:rotate-90 button-hover"
				onClick={stopPropagation}
				title="Extra info"
			>
				<ChevronRightIcon className="size-5" />
			</PopoverTrigger>

			<PopoverContent
				className="simple-scrollbar z-10 flex max-h-[20vh] min-w-60 max-w-md flex-col break-words p-4 text-sm leading-5 text-primary scrollbar-width-2"
				sideOffset={5}
				align="center"
				side="bottom"
			>
				{reasoning}
			</PopoverContent>
		</Popover>
	);
};
