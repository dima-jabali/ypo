import { Resizable } from "re-resizable";
import { Fragment, memo } from "react";

import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import {
	useWithBatchTableId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import {
	RerenderTreeProvider,
	useRerenderTreeStore,
} from "#/contexts/use-rerender-tree";
import { CanvasTable } from "../../components/canvas-table/canvas-table";
import { CellContextMenuPopover } from "../../components/cell-context-menu-popover";
import { ColumnContextMenuPopover } from "../../components/column-ctx-menu-popover";
import { ColumnOptionsPopover } from "../../components/column-options-popover/column-options-popover";
import { useDiffStore } from "../../contexts/diff-store/diff-ctx";
import { DiffStoreProvider } from "../../contexts/diff-store/diff-store";
import { BatchTableMentionablesProvider } from "../../contexts/mentionables/mentionables-provider";
import {
	HandleColorSchemeChange,
	ListenToWindowsEvents,
	TableUIProvider,
	useTableUIStore,
} from "../../contexts/table-ui";
import { useFetchBatchTableById } from "../../hooks/get/use-fetch-batch-table-by-id";
import { BatchTableChatHeader } from "../chat-with-batch-table/BatchTableChatHeader";
import { ChatWithBatchTable } from "../chat-with-batch-table/ChatWithBatchTable";
import { BatchTableFooter } from "./footer";
import { PageHeader } from "./page-header/page-header";
import { BatchTableRight } from "./right";
import { RowContextMenuPopover } from "../../components/row-context-menu-popover";
import { AssureSapienBelongsToOrg } from "#/components/assure-sapien-belongs-to-org";

const HANDLE_CLASSES_CONTAINER = {
	left: "button-hover z-0 w-1!",
};
const ENABLED_CONTAINER = {
	bottomRight: false,
	bottomLeft: false,
	topRight: false,
	topLeft: false,
	bottom: false,
	right: false,
	left: true,
	top: false,
};
const DISABLED_CONTAINER = {
	bottomRight: false,
	bottomLeft: false,
	topRight: false,
	topLeft: false,
	bottom: false,
	right: false,
	left: false,
	top: false,
};

function BatchTableMainView() {
	return (
		<div className="flex flex-col gap-2 w-full h-full overflow-hidden">
			<PageHeader />

			<div
				className="flex gap-1 w-full h-full overflow-hidden"
				aria-label="Batch table with chat wrapper"
			>
				<section
					className="grid grid-flow-col grid-cols-[1fr_30px] grid-rows-[1fr_30px] [grid-template-areas:'table_right'_'footer_footer'] h-full w-full pt-0 gap-1 overflow-hidden pl-2"
					aria-label="Actual batch table"
				>
					<CanvasTable />

					<BatchTableFooter />

					<BatchTableRight />

					<ColumnContextMenuPopover />
					<CellContextMenuPopover />
					<RowContextMenuPopover />
					<ColumnOptionsPopover />
				</section>

				<ChatSide />
			</div>
		</div>
	);
}

function ChatSide() {
	const isChatOpen = useTableUIStore().use.isChatOpen();

	return (
		<Resizable
			className="flex h-full flex-col gap-2 data-[is-chat-open=false]:hidden pr-4"
			enable={isChatOpen ? ENABLED_CONTAINER : DISABLED_CONTAINER}
			handleClasses={HANDLE_CLASSES_CONTAINER}
			data-is-chat-open={isChatOpen}
			maxWidth={700}
			minWidth={370}
		>
			<BatchTableChatHeader />

			<ChatWithBatchTable />
		</Resizable>
	);
}

function BatchTableProviders() {
	const rerenderTreeKey = useRerenderTreeStore().use.key();
	const organizationId = useWithOrganizationId();
	const batchTableId = useWithBatchTableId();
	const diffStore = useDiffStore();

	useFetchBatchTableById();

	return (
		<Fragment key={rerenderTreeKey}>
			<TableUIProvider
				extraInitialParams={{
					organizationId,
					batchTableId,
					diffStore,
				}}
			>
				<HandleColorSchemeChange />
				<ListenToWindowsEvents />

				<BatchTableMainView />
			</TableUIProvider>
		</Fragment>
	);
}

export const BatchTableWrapper = memo(function BatchTable() {
	return (
		<DefaultSuspenseAndErrorBoundary
			fallbackClassName="w-screen h-screen"
			failedText="Something went wrong!"
			fallbackFor="batch-table"
		>
			<AssureSapienBelongsToOrg>
				<RerenderTreeProvider>
					<BatchTableMentionablesProvider>
						<DiffStoreProvider>
							<BatchTableProviders />
						</DiffStoreProvider>
					</BatchTableMentionablesProvider>
				</RerenderTreeProvider>
			</AssureSapienBelongsToOrg>
		</DefaultSuspenseAndErrorBoundary>
	);
});
