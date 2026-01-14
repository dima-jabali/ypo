import { useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "#/components/Dialog";
import { BatchTableMode } from "#/types/batch-table";
import type { PostBatchTableMetadataRequest } from "../hooks/get/use-fetch-batch-table-metadatas-page";
import { usePostBatchTableMetadata } from "../hooks/post/use-post-batch-table-metadata";
import { BaseBatchTableMetadataForm } from "./base-batch-table-metadata-form";

export function CreateBatchTableModal() {
	const [isOpen, setIsOpen] = useState(false);

	const postBatchTableMutation = usePostBatchTableMetadata();

	async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (postBatchTableMutation.isPending) return;

		const formEntries = Object.fromEntries(
			new FormData(e.currentTarget).entries(),
		);

		try {
			const body: PostBatchTableMetadataRequest = {
				description: (formEntries["description"] as string | undefined) ?? "",
				name: (formEntries["name"] as string | undefined) ?? "New batch table",
				batch_table_mode: BatchTableMode.Excel,
			};

			await postBatchTableMutation.mutateAsync(body);

			setIsOpen(false);
		} catch {
			// Do nothing, already handled by mutation.
		}
	}

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger asChild>
				<Button variant={ButtonVariant.PURPLE} size="sm">
					Create
				</Button>
			</DialogTrigger>

			{isOpen ? (
				<DialogContent className="flex max-h-[90vh] max-w-3xl flex-col simple-scrollbar">
					<DialogTitle className="text-xl font-bold">
						Create batch table
					</DialogTitle>

					<BaseBatchTableMetadataForm
						onSubmit={handleCreate}
						defaultDescription=""
						defaultName=""
					>
						<DialogFooter className="flex w-full justify-between">
							<Button
								isLoading={postBatchTableMutation.isPending}
								title="Create batch table"
								variant="success"
								type="submit"
							>
								Creat{postBatchTableMutation.isPending ? "ing..." : "e"}
							</Button>
						</DialogFooter>
					</BaseBatchTableMetadataForm>
				</DialogContent>
			) : null}
		</Dialog>
	);
}
