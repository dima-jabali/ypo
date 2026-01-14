import { useState } from "react";
import { Plus } from "lucide-react";

import type { BatchTableToolSettings } from "#/types/batch-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/Dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/Tooltip";
import { Button } from "#/components/Button";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { getErrorMessage } from "#/helpers/utils";

type Props = {
	changeableToolSettings: BatchTableToolSettings;
};

export const CreateToolModal: React.FC<Props> = () => {
	const [isCreating, setIsCreating] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const handleCreateTool = async () => {
		if (isCreating) return;

		try {
			setIsCreating(true);

			setIsOpen(false);

			toast({
				title: "Successfully created tool!",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			console.log("Error creating tool!", { error });

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: "Error creating tool!",
			});
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<Tooltip>
				<TooltipTrigger title="">
					<div>
						<DialogTrigger className="rounded-sm p-1 text-primary button-hover">
							<Plus className="size-4" />
						</DialogTrigger>
					</div>
				</TooltipTrigger>

				<TooltipContent className="text-primary" side="right">
					Create Tool
				</TooltipContent>
			</Tooltip>

			<DialogContent className="simple-scrollbar z-80" overlayClassName="z-80">
				<DialogHeader>
					<DialogTitle>Create a Tool</DialogTitle>

					<DialogDescription>
						Here, you can create a tool that you can use to work on your data.
					</DialogDescription>

					<section></section>

					<DialogFooter>
						<Button
							onClick={() => setIsOpen(false)}
							variant="destructive"
							disabled={isCreating}
						>
							Cancel
						</Button>

						<Button
							onClick={handleCreateTool}
							isLoading={isCreating}
							variant="success"
						>
							Create
						</Button>
					</DialogFooter>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
};
