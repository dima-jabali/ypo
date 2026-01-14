import { useLayoutEffect, useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTrigger,
} from "#/components/Dialog";
import { Input } from "#/components/Input";
import { getProjectTagColors } from "#/components/layout/projects-helper";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { getErrorMessage } from "#/helpers/utils";
import { useCreateTag } from "#/hooks/mutation/use-create-tag";
import { type NotebookTag, NotebookTagTheme } from "#/types/notebook";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

type Props = {
	setSelectedTags: React.Dispatch<React.SetStateAction<Array<NotebookTag>>>;
	allTags: Array<NotebookTag>;
};

export const CUSTOM_IDENTIFIER_FOR_TAG_INPUT = "tag-input";
export const MAX_TAG_NAME_LENGTH = 20;

export const TagCreationModal: React.FC<Props> = ({
	setSelectedTags,
	allTags,
}) => {
	const [tagTheme, setTagTheme] = useState(NotebookTagTheme.Green);
	const [isCreatingTag, setIsCreatingTag] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [tagName, setTagName] = useState("");

	const organizationId = generalContextStore.use.organizationId();
	const createTag = useCreateTag();

	useLayoutEffect(() => {
		// Make tag's initial value be whatever the user typed on the search input.

		setTagName(
			(
				document.getElementById(
					CUSTOM_IDENTIFIER_FOR_TAG_INPUT,
				) as HTMLInputElement | null
			)?.value || "",
		);
	}, [isOpen]);

	const isInfoValid = () => {
		const tag = tagName.trim();

		if (!tag) {
			toast({
				description: "Please enter a tag name",
				variant: ToastVariant.Destructive,
				title: "Tag name is required",
			});

			return false;
		} else if (tag.length > MAX_TAG_NAME_LENGTH) {
			toast({
				description: `Tag name can have at most ${MAX_TAG_NAME_LENGTH} characters`,
				variant: ToastVariant.Destructive,
				title: "Tag name is too long",
			});

			return false;
		}

		return true;
	};

	const doesTagAlreadyExist = () => {
		const name = tagName.trim();

		const exists = allTags.some((tag) => tag.name === name);

		if (exists) {
			toast({
				variant: ToastVariant.Destructive,
				title: "Tag name already exists",
			});
		}

		return exists;
	};

	const handleCreateTag = async () => {
		try {
			setIsCreatingTag(true);

			if (!isInfoValid()) return;
			if (doesTagAlreadyExist()) return;

			const tag = await createTag.mutateAsync({
				color: tagTheme,
				organizationId,
				name: tagName,
			});

			if (!tag) throw new Error("Failed to create tag");

			setSelectedTags((prev) => [...prev, tag]);
			setIsOpen(false);

			toast({
				title: "Tag created successfully",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			console.error("Error creating tag:", error);

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: "Error creating tag",
			});
		} finally {
			setIsCreatingTag(false);
		}
	};

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger className="flex h-12 w-full shrink-0 items-center justify-center transition-none onfocus:bg-button-hover">
				Create new tag
			</DialogTrigger>

			<DialogContent
				className="flex max-w-lg flex-col z-110"
				overlayClassName="z-110"
			>
				<DialogHeader className="text-xl font-bold">Create Tag</DialogHeader>

				<label className="flex flex-col gap-2">
					<p>Tag name</p>

					<Input
						onChange={(e) => setTagName(e.target.value)}
						maxLength={MAX_TAG_NAME_LENGTH}
						aria-disabled={isCreatingTag}
						placeholder="Tag name..."
						value={tagName}
						minLength={1}
					/>
				</label>

				<label className="flex flex-col gap-2">
					<p>Tag Color</p>

					<div className="flex flex-wrap gap-2">
						{Object.values(NotebookTagTheme).map((theme, i) => (
							<button
								className={`h-7 w-16 rounded ring-4 ring-transparent ${getProjectTagColors(
									theme,
								)} ${theme === tagTheme ? "ring-teal-600!" : ""}`}
								onPointerUp={() => setTagTheme(theme)}
								aria-disabled={isCreatingTag}
								title={theme}
								key={i}
							/>
						))}
					</div>
				</label>

				<label className="flex flex-col gap-2">
					<p>Preview</p>

					<span
						className={`flex min-h-[1.75rem] w-min items-center justify-center overflow-hidden whitespace-nowrap rounded p-2 ${getProjectTagColors(
							tagTheme,
						)}`}
						title={tagTheme}
					>
						{tagName || "My Example"}
					</span>
				</label>

				<DialogFooter>
					<Button
						variant={ButtonVariant.SUCCESS}
						onPointerUp={handleCreateTag}
						isLoading={isCreatingTag}
					>
						Creat{isCreatingTag ? "ing..." : "e"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
