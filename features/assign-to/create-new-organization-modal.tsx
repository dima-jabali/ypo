import { useEffect, useRef, useState } from "react";
import { prettifyError, z } from "zod/mini";

import { Button, ButtonVariant } from "#/components/Button";
import {
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogTitle,
} from "#/components/Dialog";
import { Input } from "#/components/Input";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { createNotebookUuid, getErrorMessage } from "#/helpers/utils";
import { useFetchBetterbrainUser } from "#/hooks/fetch/use-fetch-betterbrain-user";
import { useCreateNotebook } from "#/hooks/mutation/use-create-notebook";
import { useCreateOrganization } from "#/hooks/mutation/use-create-organization";
import { NotebookImportance, NotebookStatus } from "#/types/notebook";

type Props = {
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ORGANIZATION_CREATION_VALUES = z.object({
	name: z.string().check(
		z.trim(),
		z.minLength(1, { message: "Organization name is required!" }),
		z.maxLength(128, {
			message: "Organization name is too long!",
		}),
	),
});

export function CreateNewOrganizationModal({ setIsOpen }: Props) {
	const [isCreating, setIsCreating] = useState(false);

	const formRef = useRef<HTMLFormElement>(null);
	const shouldCreateProjectRef = useRef(true);

	const createOrganization = useCreateOrganization();
	const betterbrainUser = useFetchBetterbrainUser();
	const createNotebook = useCreateNotebook();

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.metaKey && e.shiftKey) {
				shouldCreateProjectRef.current = false;
			}
		}

		function handleKeyUp(e: KeyboardEvent) {
			if (e.metaKey && e.shiftKey) {
				shouldCreateProjectRef.current = true;
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	async function handleCreateOrganization(e: React.FormEvent) {
		e.preventDefault();

		if (isCreating || !formRef.current || !betterbrainUser) return;

		const shouldCreateOrgWithProject = shouldCreateProjectRef.current;

		try {
			setIsCreating(true);

			const formData = new FormData(formRef.current);

			const data: Record<string, string> = {};

			for (const [key, value] of formData) {
				// @ts-expect-error => It's fine, we're not sending any files.
				data[key] = value;
			}

			const result = ORGANIZATION_CREATION_VALUES.safeParse(data);

			if (result.error) {
				throw new Error(prettifyError(result.error));
			}

			const newOrganization = await createOrganization.mutateAsync({
				name: result.data.name,
			});

			if (!newOrganization) {
				throw new Error("Failed to create organization!");
			}

			console.log({ shouldCreateOrgWithProject });

			if (shouldCreateOrgWithProject) {
				// Create a new project so the user already has a chat:
				const projectMetadata = await createNotebook.mutateAsync({
					metadata: {
						status: NotebookStatus.NotStarted,
						priority: NotebookImportance.Low,
						uuid: createNotebookUuid(),
						title: "New Chat",
						favorited: false,
						assigned_to: [],
						description: "",
						tags: [],
					},
					organizationId: newOrganization.id,
					blocks: [],
				});

				if (!projectMetadata) {
					throw new Error("Failed to create project!");
				}

				generalContextStore.setState({
					botConversationId:
						projectMetadata.metadata.bot_conversation?.id ?? null,
					notebookId: projectMetadata.metadata.id,
					organizationId: newOrganization.id,
				});
			} else {
				generalContextStore.setState({
					botConversationId: null,
					notebookId: null,
					organizationId: newOrganization.id,
				});
			}

			setIsOpen(false);

			toast({
				title: "New organization created successfully",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			console.error(error);

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: "Project creation error",
			});
		} finally {
			setIsCreating(false);
		}
	}

	return (
		<Dialog onOpenChange={setIsOpen} open>
			<DialogOverlay />

			<DialogContent className="max-w-sm md:max-w-sm">
				<form
					onSubmit={handleCreateOrganization}
					className="flex flex-col gap-8"
					ref={formRef}
				>
					<DialogTitle className="mb-5 text-xl font-bold">
						Create organization
					</DialogTitle>

					<label className="flex flex-col gap-3">
						Organization name:
						<Input name="name" placeholder="Organization name" />
					</label>

					<div className="flex w-full justify-center">
						<Button
							variant={ButtonVariant.SUCCESS}
							title="Create organization"
							isLoading={isCreating}
							type="submit"
						>
							Creat{isCreating ? "ing..." : "e"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
