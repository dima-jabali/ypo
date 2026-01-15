import { ChevronRight } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { memo, useMemo, useState } from "react";

import { LOADER } from "#/components/Button";
import { Checkbox } from "#/components/Checkbox";
import { Separator } from "#/components/separator";
import { isValidNumber, stopPropagation } from "#/helpers/utils";
import {
	useFetchConnectionData,
	type GetConnectionDataRequest,
} from "#/hooks/fetch/use-fetch-connection-data";
import type { ClickUpConnectionFieldsUpdate } from "#/hooks/mutation/use-sync-clickup";
import { useForceRender } from "#/hooks/use-force-render";
import { matchIcon } from "#/icons/match-icon";
import {
	ClickUpEntityType,
	DatabaseConnectionType,
	type ClickUpChatView,
	type ClickUpConnectionId,
	type ClickUpConnectionType,
	type ClickUpFolder,
	type ClickUpList,
	type ClickUpSpace,
	type ClickUpWorkspace,
} from "#/types/databases";
import type { OrganizationId } from "#/types/general";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

type CheckedState = CheckboxPrimitive.CheckedState;

type Props = {
	updatesRef: React.RefObject<Array<ClickUpConnectionFieldsUpdate>>;
	clickUpDatabaseConnection: ClickUpConnectionType;
};

export const Tree = memo(function Tree({
	clickUpDatabaseConnection,
	updatesRef,
}: Props) {
	const organizationId = generalContextStore.use.organizationId();

	if (!isValidNumber(organizationId)) {
		return null;
	}

	return (
		<div className="flex flex-col">
			{clickUpDatabaseConnection.workspaces.map((item) => (
				<TreeItem
					clickUpConnectionId={clickUpDatabaseConnection.id}
					organizationId={organizationId}
					updatesRef={updatesRef}
					key={makeItemId(item)}
					item={item}
				/>
			))}
		</div>
	);
});

type Item =
	| ClickUpWorkspace
	| ClickUpChatView
	| ClickUpFolder
	| ClickUpSpace
	| ClickUpList;

const getIsWorkspace = (item: Item): item is ClickUpWorkspace =>
	"workspace_id" in item;
const getIsChatView = (item: Item): item is ClickUpChatView =>
	"view_id" in item;
const getIsFolder = (item: Item): item is ClickUpFolder => "folder_id" in item;
const getIsSpace = (item: Item): item is ClickUpSpace => "space_id" in item;
const getIsList = (item: Item): item is ClickUpList => "list_id" in item;

const getFriendlyItemType = (item: Item) => {
	if (getIsWorkspace(item)) return "Workspace";
	if (getIsChatView(item)) return "Chat View";
	if (getIsFolder(item)) return "Folder";
	if (getIsSpace(item)) return "Space";
	if (getIsList(item)) return "List";

	return undefined;
};

const getItemType = (item: Item) => {
	if (getIsWorkspace(item)) return ClickUpEntityType.Workspace;
	if (getIsChatView(item)) return ClickUpEntityType.ChatView;
	if (getIsFolder(item)) return ClickUpEntityType.Folder;
	if (getIsSpace(item)) return ClickUpEntityType.Space;
	if (getIsList(item)) return ClickUpEntityType.List;

	return null;
};

const makeItemId = (item: Item) => `${getItemType(item)}-${item.id}`;

function getOrCreateUpdateItem(
	item: Item,
	updatesRef: React.RefObject<Array<ClickUpConnectionFieldsUpdate>>,
) {
	const entityType = getItemType(item);

	if (!entityType) {
		console.error("Invalid entity type", { item });

		throw new Error("Invalid entity type!");
	}

	const itemId = item.id;

	const existingUpdateItem = updatesRef.current.find(
		({ entity_id, entity_type }) =>
			entity_id === itemId && entity_type === entityType,
	);

	if (existingUpdateItem) {
		return existingUpdateItem;
	}

	const newUpdateItem: ClickUpConnectionFieldsUpdate = {
		index_children_by_default: item.index_by_default,
		include_in_indexing: item.include_in_indexing,
		entity_type: entityType,
		entity_id: itemId,
	};

	if ("index_documents" in item) {
		newUpdateItem.index_documents_for_children_by_default =
			item.index_documents_by_default;
		newUpdateItem.index_documents = item.index_documents;
	}

	updatesRef.current.push(newUpdateItem);

	return newUpdateItem;
}

const TreeItem: React.FC<{
	item:
		| ClickUpWorkspace
		| ClickUpChatView
		| ClickUpFolder
		| ClickUpSpace
		| ClickUpList;
	updatesRef: React.RefObject<Array<ClickUpConnectionFieldsUpdate>>;
	clickUpConnectionId: ClickUpConnectionId;
	organizationId: OrganizationId;
}> = memo(function TreeItem({
	item,
	clickUpConnectionId,
	updatesRef,
	organizationId,
}) {
	const { id, name } = item;

	const [{ params, hasChildren, ButtonOrDiv, icon, friendlyItemType }] =
		useState(() => {
			const params: GetConnectionDataRequest = {
				connection_type: DatabaseConnectionType.ClickUp,
				connection_id: clickUpConnectionId,
				organization_id: organizationId,

				include_folder_lists: true,
				include_chat_views: true,
				include_folders: true,
				include_spaces: true,
				include_lists: true,
			};

			if (getIsWorkspace(item)) {
				params.workspace_id = id;
			} else if (getIsSpace(item)) {
				params.space_id = id;
			} else if (getIsFolder(item)) {
				params.folder_id = id;
			} else if (getIsList(item)) {
				params.list_id = id;
			}

			const hasChildren = !getIsChatView(item);
			const entityType = getItemType(item);

			const icon =
				"avatar" in item && item.avatar ? (
					<img
						className="rounded-full flex-none"
						src={item.avatar}
						height={20}
						width={20}
						alt=""
					/>
				) : (
					matchIcon(entityType)
				);

			const friendlyItemType = getFriendlyItemType(item);

			return {
				ButtonOrDiv: hasChildren ? ("button" as const) : ("div" as const),
				friendlyItemType,
				hasChildren,
				entityType,
				params,
				icon,
			};
		});
	const [isChanging, setIsChanging] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const fetchConnectionData = useFetchConnectionData(isOpen, params);
	const forceRender = useForceRender();

	const itemWithUpdates = getOrCreateUpdateItem(item, updatesRef);

	const handleToggleIsOpen = () => {
		setIsOpen((prev) => !prev);
	};

	const handleToggleMarkToIncludeInIndexing = (e: CheckedState) => {
		const newIsChecked = e.valueOf() as boolean;

		itemWithUpdates.include_in_indexing = newIsChecked;

		if (newIsChecked === false) {
			delete itemWithUpdates["index_children_by_default"];
		}

		setIsChanging(true);
		forceRender();
	};

	const handleToggleMarkToIndexDocuments = (e: CheckedState) => {
		const newIsChecked = e.valueOf() as boolean;

		itemWithUpdates.index_documents = newIsChecked;

		if (newIsChecked === false) {
			delete itemWithUpdates["index_documents_for_children_by_default"];
		}

		setIsChanging(true);
		forceRender();
	};

	const handleToggleRecursiveIndex = (e: CheckedState) => {
		itemWithUpdates.select_indexing_recursive = e.valueOf() as boolean;

		setIsChanging(true);
		forceRender();
	};

	const handleToggleRecursiveIndexDocuments = (e: CheckedState) => {
		itemWithUpdates.select_index_documents_recursive = e.valueOf() as boolean;

		setIsChanging(true);
		forceRender();
	};

	const handleToggleIndexChildrenByDefault = (e: CheckedState) => {
		itemWithUpdates.index_children_by_default = e.valueOf() as boolean;

		setIsChanging(true);
		forceRender();
	};

	const handleToggleIndexChildrenDocumentsByDefault = (e: CheckedState) => {
		itemWithUpdates.index_documents_for_children_by_default =
			e.valueOf() as boolean;

		setIsChanging(true);
		forceRender();
	};

	const data = fetchConnectionData.data;

	const children = useMemo(
		() =>
			data
				? ([] as Array<Item>).concat(
						data.folder?.chat_views ?? [],
						data.folder?.lists ?? [],

						data.space?.chat_views ?? [],
						data.space?.folders ?? [],
						data.space?.lists ?? [],

						data.workspace?.chat_views ?? [],
						data.workspace?.spaces ?? [],

						data.list?.chat_views ?? [],
						// data.list?.tasks ?? [],
					)
				: [],
		[data],
	);

	const hasLink = false;

	return (
		<>
			<div
				className="flex gap-2 flex-none onfocus:bg-button-hover py-1 rounded-lg"
				title={friendlyItemType}
			>
				<ButtonOrDiv
					className="flex h-7 min-w-fit pr-3 flex-none items-center justify-start gap-2 whitespace-nowrap text-sm font-normal tracking-wide transition-none data-[type=button]:button-hover rounded-full"
					onClick={hasChildren ? handleToggleIsOpen : undefined}
					aria-expanded={hasChildren ? isOpen : undefined}
					data-type={ButtonOrDiv}
				>
					{hasChildren ? (
						<ChevronRight
							className="size-4 flex-none data-[open=true]:rotate-90 ml-2"
							data-open={isOpen}
						/>
					) : (
						<span className="h-4 w-6 flex-none"></span>
					)}

					{icon}

					{hasLink ? (
						<a
							href={"https://google.com"}
							className="underline link"
							onClick={stopPropagation}
							target="_blank"
						>
							{name}
						</a>
					) : (
						<span>{name}</span>
					)}
				</ButtonOrDiv>

				<div className="rounded-full flex h-7 items-center px-2 py-0.5 border border-border-smooth gap-2 text-xs select-none">
					<label className="flex items-center h-full gap-2">
						<span>Index</span>

						<Checkbox
							onCheckedChange={handleToggleMarkToIncludeInIndexing}
							checked={itemWithUpdates.include_in_indexing}
						/>
					</label>

					{itemWithUpdates.include_in_indexing && hasChildren ? (
						<>
							<Separator orientation="vertical" />

							<label className="flex items-center h-full gap-2">
								<span>Index children by default</span>

								<Checkbox
									checked={itemWithUpdates.index_children_by_default ?? false}
									onCheckedChange={handleToggleIndexChildrenByDefault}
								/>
							</label>
						</>
					) : null}

					{isChanging && hasChildren ? (
						<>
							<Separator orientation="vertical" />

							<label className="flex items-center h-full gap-2">
								<span>Recursive</span>

								<Checkbox
									checked={itemWithUpdates.select_indexing_recursive ?? false}
									onCheckedChange={handleToggleRecursiveIndex}
								/>
							</label>
						</>
					) : null}
				</div>

				{"index_documents" in item ? (
					<div className="rounded-full flex h-7 items-center px-2 py-0.5 border border-border-smooth gap-2 text-xs select-none">
						<label className="flex items-center h-full gap-2">
							<span>Index documents</span>

							<Checkbox
								onCheckedChange={handleToggleMarkToIndexDocuments}
								checked={itemWithUpdates.index_documents ?? false}
							/>
						</label>

						{itemWithUpdates.index_documents && hasChildren ? (
							<>
								<Separator orientation="vertical" />

								<label className="flex items-center h-full gap-2">
									<span>Index children documents by default</span>

									<Checkbox
										checked={
											itemWithUpdates.index_documents_for_children_by_default ??
											false
										}
										onCheckedChange={
											handleToggleIndexChildrenDocumentsByDefault
										}
									/>
								</label>
							</>
						) : null}

						{isChanging && hasChildren ? (
							<>
								<Separator orientation="vertical" />

								<label className="flex items-center h-full gap-2">
									<span>Recursive</span>

									<Checkbox
										checked={
											itemWithUpdates.select_index_documents_recursive ?? false
										}
										onCheckedChange={handleToggleRecursiveIndexDocuments}
									/>
								</label>
							</>
						) : null}
					</div>
				) : null}
			</div>

			{isOpen ? (
				<div className="w-full [&>button]:ml-5 [&>div]:ml-5 flex flex-col">
					{fetchConnectionData.isLoading ? (
						<div className="flex h-7 flex-none aspect-square items-center justify-start">
							{LOADER}
						</div>
					) : children.length > 0 ? (
						children.map((child) => (
							<TreeItem
								clickUpConnectionId={clickUpConnectionId}
								organizationId={organizationId}
								updatesRef={updatesRef}
								key={makeItemId(child)}
								item={child}
							/>
						))
					) : (
						<div className="flex h-7 flex-none items-center justify-start font-bold text-gray-500 text-sm">
							No children
						</div>
					)}
				</div>
			) : null}
		</>
	);
});
