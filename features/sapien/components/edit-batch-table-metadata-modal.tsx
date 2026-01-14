import { Button } from "#/components/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "#/components/Dialog";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { getErrorMessage, noop } from "#/helpers/utils";
import { useEffect, useState } from "react";
import { BaseBatchTableMetadataForm } from "./base-batch-table-metadata-form";
import type { BatchTable } from "#/types/batch-table";
import {
	usePutBatchTableMetadata,
	type PutBatchTableMetadataRequest,
} from "../hooks/put/use-put-batch-table-metadata";

type Props = {
	batchTableMetadata: BatchTable;
};

export function EditBatchTableMetadataModal({ batchTableMetadata }: Props) {
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isArchiving, setIsArchiving] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const putBatchTableMetadata = usePutBatchTableMetadata().mutateAsync;

	const isDoingNetworkStuff = isArchiving || isSaving;

	async function handleSave(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (!batchTableMetadata.id || isDoingNetworkStuff) return;

		const formEntries = Object.fromEntries(
			new FormData(e.currentTarget).entries(),
		);

		setIsSaving(true);

		try {
			const descriptionFromForm = formEntries["description"] as
				| string
				| undefined;
			const nameFromForm = formEntries["name"] as string | undefined;
			const body: PutBatchTableMetadataRequest["body"] = {};

			if (nameFromForm && nameFromForm !== batchTableMetadata.name) {
				body.name = nameFromForm;
			}
			if (
				descriptionFromForm &&
				descriptionFromForm !== batchTableMetadata.description
			) {
				body.description = descriptionFromForm;
			}

			await putBatchTableMetadata({
				body,
				pathParams: {
					batch_table_id: batchTableMetadata.id,
				},
			});

			setIsOpen(false);

			toast({
				title: "Batch table metadata updated successfully",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			console.log("Error updating batch table metadata!", error);

			toast({
				title: "Error updating batch table metadata",
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
			});
		} finally {
			setIsSaving(false);
		}
	}

	async function handleArchive() {
		if (isDoingNetworkStuff || !batchTableMetadata.id) return;

		setIsArchiving(true);

		try {
			await putBatchTableMetadata({
				body: {
					archived: !batchTableMetadata.archived,
				},
				pathParams: {
					batch_table_id: batchTableMetadata.id,
				},
			});

			setIsOpen(false);

			toast({
				title: `Batch table ${batchTableMetadata.archived ? "un" : ""}archived successfully`,
				variant: ToastVariant.Success,
			});
		} catch (error) {
			console.log("Error archiving batch table!", error);

			toast({
				title: "Error archiving batch table",
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
			});
		} finally {
			setIsArchiving(false);
		}
	}

	function handleConfirmArchivation(isConfirmed: boolean) {
		setIsConfirmOpen(false);

		if (isConfirmed) {
			handleArchive().catch(noop);
		}
	}

	useEffect(() => {
		if (!isOpen) {
			setIsConfirmOpen(false);
		}
	}, [isOpen]);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger className="ignore-table-row-click flex h-full w-full items-center justify-center hover:bg-accent hover:text-accent-foreground active:bg-accent-strong underline">
				Edit
			</DialogTrigger>

			{isOpen ? (
				<DialogContent className="flex max-h-[90vh] max-w-3xl flex-col simple-scrollbar">
					<DialogTitle className="mb-5 text-xl font-bold">
						Edit batch table metadata
					</DialogTitle>

					<BaseBatchTableMetadataForm
						defaultDescription={batchTableMetadata.description || ""}
						defaultName={batchTableMetadata.name || ""}
						onSubmit={handleSave}
					>
						<DialogFooter className="flex w-full justify-between">
							<Dialog onOpenChange={setIsConfirmOpen} open={isConfirmOpen}>
								<DialogTrigger asChild>
									<Button
										title={`${batchTableMetadata.archived ? "Una" : "A"}rchive batch table`}
										disabled={isDoingNetworkStuff}
										isLoading={isArchiving}
										variant="outline"
									>
										{batchTableMetadata.archived ? "Una" : "A"}rchiv
										{isArchiving ? "ing..." : "e"}
									</Button>
								</DialogTrigger>

								<DialogContent overlayClassName="z-70" className="z-70">
									<DialogTitle className="text-xl font-bold">
										Confirm batch table archivation
									</DialogTitle>

									<DialogDescription className="text-base text-primary">
										Are you sure you want to{" "}
										{batchTableMetadata.archived ? "un" : ""}
										archive the batch table &quot;
										<span className="font-bold">{batchTableMetadata.name}</span>
										&quot;? If you made changes, save them first, then archive.
									</DialogDescription>

									<DialogFooter>
										<Button
											onPointerUp={() => handleConfirmArchivation(false)}
											title="Do not archive batch table"
											variant="destructive"
										>
											Cancel
										</Button>

										<Button
											onPointerUp={() => handleConfirmArchivation(true)}
											title="Confirm and archive batch table"
											variant="success"
										>
											Confirm
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>

							<Button
								disabled={isDoingNetworkStuff}
								title="Save changes"
								isLoading={isSaving}
								variant="success"
								type="submit"
							>
								Sav{isSaving ? "ing..." : "e"}
							</Button>
						</DialogFooter>
					</BaseBatchTableMetadataForm>
				</DialogContent>
			) : null}
		</Dialog>
	);
}
