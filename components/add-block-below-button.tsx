import { Plus } from "lucide-react";
import { memo } from "react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { Separator } from "../separator";
import { useSlashStore } from "#/features/notebook/components/slash-plugin/ctx";
import type { NotebookBlockUuid } from "#/types/notebook";
import { cn } from "#/helpers/class-names";

type Props = {
	blockAboveUuid: NotebookBlockUuid | null;
	alwaysVisible?: boolean;
};

export const AddBlockBelowButton = memo(function AddBlockBelowButton(
	props: Props,
) {
	const isNotebookMode = generalContextStore.use.isNotebookMode();

	return isNotebookMode ? <Content {...props} /> : null;
});

function Content({ blockAboveUuid, alwaysVisible }: Props) {
	const slashStore = useSlashStore();

	function handleOpenSlash(e: React.MouseEvent<HTMLButtonElement>) {
		slashStore.setState({
			anchor: { style: { top: e.clientY }, blockAboveUuid },
			isOpen: true,
		});
	}

	return (
		<button
			className={cn(
				"flex items-center justify-center w-full h-10 relative focus:opacity-80 hover:opacity-80 active:opacity-100 opacity-0 group-hover/block:opacity-50",
				alwaysVisible && "opacity-40",
			)}
			onClick={handleOpenSlash}
		>
			<Separator className="absolute top-[calc(50%-1px)] z-0" />

			<div className="flex h-full w-fit px-2 items-center justify-center gap-2 text-xs bg-notebook z-1">
				<Plus className="size-3" />

				<span>Add block below</span>
			</div>
		</button>
	);
}
