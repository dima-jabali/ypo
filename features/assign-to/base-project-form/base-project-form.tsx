/* eslint-disable react-refresh/only-export-components */

import { type PropsWithChildren } from "react";
import { X } from "lucide-react";

import { Input } from "#/components/Input";
import { StyledTextarea } from "#/components/styled-text-area";
import { TagGroup, type TagGroupProps } from "#/components/tag-group";
import {
	CUSTOM_IDENTIFIER_FOR_TAG_INPUT,
	TagCreationModal,
} from "#/features/assign-to/base-project-form/tag-creation-modal";
import type { NotebookMetadata, NotebookTag } from "#/types/notebook";
import { getProjectTagColors } from "#/components/layout/projects-helper";
import {
	MAX_TITLE_LENGTH,
	PRIORITY_OPTIONS,
	STATUS_OPTIONS,
	type ProjectAssigneeForMultiSelect,
} from "#/components/layout/edit-notebook-modal";
import { isRecord } from "#/helpers/utils";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

type Props = PropsWithChildren<{
	assignTo: Array<ProjectAssigneeForMultiSelect>;
	users: Array<ProjectAssigneeForMultiSelect>;
	priority: typeof PRIORITY_OPTIONS;
	selectedTags: Array<NotebookTag>;
	tags: Array<NotebookTag> | null;
	ref: React.Ref<HTMLFormElement>;
	status: typeof STATUS_OPTIONS;
	project?: NotebookMetadata;
	setAssignTo: React.Dispatch<
		React.SetStateAction<Array<ProjectAssigneeForMultiSelect>>
	>;
	setPriority: React.Dispatch<React.SetStateAction<typeof PRIORITY_OPTIONS>>;
	setStatus: React.Dispatch<React.SetStateAction<typeof STATUS_OPTIONS>>;
	setSelectedTags: React.Dispatch<React.SetStateAction<Array<NotebookTag>>>;
	onSubmit: () => void;
}>;

export const NO_MORE_ITEMS_TO_SELECT = (
	<p className="flex h-12 w-full items-center justify-center p-2">
		No more items to select
	</p>
);

const NO_MORE_MEMBERS_TO_SELECT = (
	<p className="flex h-12 w-full items-center justify-center p-2">
		No options available. Please, add members to this organization.
	</p>
);

export function BaseProjectForm({
	selectedTags,
	children,
	priority,
	assignTo,
	project,
	status,
	users,
	tags,
	ref,
	setSelectedTags,
	setAssignTo,
	setPriority,
	setStatus,
	onSubmit,
}: Props) {
	const showEditProjectDescription =
		generalContextStore.use.showEditProjectDescription();
	const showEditProjectAssignTo =
		generalContextStore.use.showEditProjectAssignTo();
	const showEditProjectPriority =
		generalContextStore.use.showEditProjectPriority();
	const showEditProjectStatus = generalContextStore.use.showEditProjectStatus();
	const showEditProjectTags = generalContextStore.use.showEditProjectTags();

	const description = (() => {
		if (!project) return "";

		if (typeof project.description === "string") return project.description;

		return (
			project.description?.custom_block_info?.paragraph
				?.map((item) =>
					Array.isArray(item)
						? item.map((i) => i.text ?? "").join("")
						: isRecord(item) && "text" in item
							? item.text
							: "",
				)
				.join("") ?? ""
		);
	})();

	return (
		<form
			className="flex max-w-full flex-col gap-8 simple-scrollbar px-1"
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit();
			}}
			ref={ref}
		>
			<label className="flex flex-col gap-1">
				<span className="font-semibold text-sm">
					Title<sup>*</sup>
				</span>

				<Input
					defaultValue={project?.title}
					maxLength={MAX_TITLE_LENGTH}
					placeholder="Title..."
					name="title"
					autoFocus
				/>
			</label>

			{showEditProjectDescription ? (
				<label className="flex flex-col gap-1">
					<span className="font-semibold text-sm">Description</span>

					<StyledTextarea
						placeholder="Description..."
						defaultValue={description}
						className="resize-none"
						name="description"
					/>
				</label>
			) : null}

			{tags && showEditProjectTags ? (
				<fieldset className="flex flex-col gap-1">
					<label className="font-semibold text-sm">Tags</label>

					<TagGroup
						footer={
							<TagCreationModal
								setSelectedTags={setSelectedTags}
								allTags={tags}
							/>
						}
						customInputIdentifier={CUSTOM_IDENTIFIER_FOR_TAG_INPUT}
						noMoreItemsToSelect={NO_MORE_ITEMS_TO_SELECT}
						renderRemovableItem={renderRemovableTagItem}
						setSelectedValues={setSelectedTags}
						selectedValues={selectedTags}
						placeholder="Search tags..."
						renderItem={renderTagItem}
						allValues={tags}
						withSearch
						isMulti
					/>
				</fieldset>
			) : null}

			{showEditProjectAssignTo ? (
				<fieldset className="flex flex-col gap-1">
					<label className="font-semibold text-sm">Assign To</label>

					<TagGroup
						renderRemovableItem={renderRemovableAssignToItem}
						noMoreItemsToSelect={NO_MORE_MEMBERS_TO_SELECT}
						renderItem={renderAssignToItem}
						setSelectedValues={setAssignTo}
						placeholder="Assign To..."
						selectedValues={assignTo}
						allValues={users}
						withSearch
						isMulti
					/>
				</fieldset>
			) : null}

			{showEditProjectPriority ? (
				<fieldset className="flex flex-col gap-1">
					<label className="font-semibold text-sm">Priority</label>

					<TagGroup
						renderRemovableItem={renderRemovablePriorityItem}
						noMoreItemsToSelect={NO_MORE_ITEMS_TO_SELECT}
						renderItem={renderPriorytyItem}
						setSelectedValues={setPriority}
						allValues={PRIORITY_OPTIONS}
						placeholder="Priority..."
						selectedValues={priority}
					/>
				</fieldset>
			) : null}

			{showEditProjectStatus ? (
				<fieldset className="flex flex-col gap-1">
					<label className="font-semibold text-sm">Status</label>

					<TagGroup
						renderRemovableItem={renderRemovableStatusItem}
						noMoreItemsToSelect={NO_MORE_ITEMS_TO_SELECT}
						renderItem={renderStatusItem}
						setSelectedValues={setStatus}
						allValues={STATUS_OPTIONS}
						placeholder="Status..."
						selectedValues={status}
					/>
				</fieldset>
			) : null}

			{children}
		</form>
	);
}

const renderRemovableTagItem: TagGroupProps<NotebookTag>["renderRemovableItem"] =
	({ name, color }, index, handleRemoveSelectedValue) => (
		<div /* Selected item container */
			key={name}
			className={`relative box-border flex w-min items-center justify-center overflow-hidden rounded ${getProjectTagColors(
				color,
			)}`}
		>
			<p className="whitespace-nowrap px-2">{name}</p>

			<button /* Remove item button */
				className="h-full p-2 transition-none hover:bg-destructive/80 hover:text-primary"
				onClick={() => handleRemoveSelectedValue(index)}
				type="button"
			>
				<X className="size-4" />
			</button>
		</div>
	);

const renderRemovablePriorityItem: TagGroupProps<
	(typeof PRIORITY_OPTIONS)[0]
>["renderRemovableItem"] = (
	{ name, color },
	index,
	handleRemoveSelectedValue,
) => (
	<div /* Selected item container */
		className={`relative box-border flex w-min items-center justify-center overflow-hidden rounded ${getProjectTagColors(
			color,
		)}`}
		key={name}
	>
		<p className="whitespace-nowrap px-2">{name}</p>

		<button /* Remove item button */
			className="h-full p-2 transition-none hover:bg-destructive/80 hover:text-primary"
			onClick={() => handleRemoveSelectedValue(index)}
			type="button"
		>
			<X className="size-4" />
		</button>
	</div>
);

const renderTagItem: TagGroupProps<NotebookTag>["renderItem"] = (
	item,
	handleAddSelectedValue,
) => (
	<div key={item.name}>
		<button
			className="w-full p-2 transition-none hover:bg-blue-400/40"
			onClick={() => handleAddSelectedValue(item)}
		>
			<span
				className={`relative box-border flex w-min items-center justify-center overflow-hidden whitespace-nowrap rounded px-2 py-1 ${getProjectTagColors(
					item.color,
				)}`}
			>
				{item.name}
			</span>
		</button>
	</div>
);

const renderPriorytyItem: TagGroupProps<
	(typeof PRIORITY_OPTIONS)[0]
>["renderItem"] = (item, handleAddSelectedValue) => (
	<div key={item.name}>
		<button
			className="w-full p-2 transition-none hover:bg-blue-400/40"
			onClick={() => handleAddSelectedValue(item)}
		>
			<span
				className={`relative box-border flex w-min items-center justify-center overflow-hidden whitespace-nowrap rounded px-2 py-1 ${getProjectTagColors(
					item.color,
				)}`}
			>
				{item.name}
			</span>
		</button>
	</div>
);

const renderRemovableStatusItem: TagGroupProps<
	(typeof STATUS_OPTIONS)[0]
>["renderRemovableItem"] = ({ name }, index, handleRemoveSelectedValue) => (
	<div /* Selected item container */
		className="relative box-border flex w-min items-center justify-center overflow-hidden rounded-sm bg-gray-200 text-gray-700"
		key={name}
	>
		<p className="whitespace-nowrap px-2">{name}</p>

		<button /* Remove item button */
			className="h-full p-2 transition-none hover:bg-destructive/80 hover:text-primary"
			onClick={() => handleRemoveSelectedValue(index)}
			type="button"
		>
			<X className="size-4" />
		</button>
	</div>
);

const renderStatusItem: TagGroupProps<
	(typeof STATUS_OPTIONS)[0]
>["renderItem"] = (item, handleAddSelectedValue) => (
	<div key={item.name}>
		<button
			className="w-full p-2 text-gray-700 transition-none hover:bg-blue-400/40"
			onClick={() => handleAddSelectedValue(item)}
		>
			<span className="relative box-border flex w-min items-center justify-center overflow-hidden whitespace-nowrap rounded-sm bg-gray-200 px-2 py-1">
				{item.name}
			</span>
		</button>
	</div>
);

const renderRemovableAssignToItem: TagGroupProps<ProjectAssigneeForMultiSelect>["renderRemovableItem"] =
	({ name }, index, handleRemoveSelectedValue) => (
		<div /* Selected item container */
			className="relative box-border flex w-min items-center justify-center overflow-hidden rounded-sm bg-gray-200 text-gray-700"
			key={name}
		>
			<p className="whitespace-nowrap px-2">{name}</p>

			<button /* Remove item button */
				className="h-full p-2 transition-none hover:bg-destructive/80 hover:text-primary"
				onClick={() => handleRemoveSelectedValue(index)}
				type="button"
			>
				<X className="size-4" />
			</button>
		</div>
	);

const renderAssignToItem: TagGroupProps<ProjectAssigneeForMultiSelect>["renderItem"] =
	(item, handleAddSelectedValue) => (
		<div key={item.name}>
			<button
				className="w-full p-2 text-gray-700 transition-none hover:bg-blue-400/40"
				onClick={() => handleAddSelectedValue(item)}
			>
				<span className="relative box-border flex w-min items-center justify-center overflow-hidden whitespace-nowrap rounded-sm bg-gray-200 px-2 py-1">
					{item.name}
				</span>
			</button>
		</div>
	);
