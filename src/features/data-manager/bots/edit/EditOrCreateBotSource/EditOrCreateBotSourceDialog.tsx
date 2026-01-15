import { useState } from "react";

import { PDF_Or_CSV_Form } from "./Forms/PDF_Or_CSV/PDF_Or_CSV_Form";
import { SlackForm } from "./Forms/Slack/SlackForm";
import { WebForm } from "./Forms/Web/WebForm";
import {
	BOT_NAME_INPUT_NAME,
	BOT_SOURCE_DESCRIPTION_INPUT_NAME,
	EDIT_OR_CREATE_BOT_SOURCE_FORM_ID,
	IS_BOT_SOURCE_ARCHIVED_INPUT_NAME,
} from "./helpers";
import {
	BotSourceFormAction,
	BotSourceType,
	type BotSource,
} from "#/types/bot-source";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/select";
import { Input } from "#/components/Input";
import { StyledTextarea } from "#/components/styled-text-area";
import { matchIcon } from "#/icons/match-icon";
import { useFetchBotSourcesPage } from "#/hooks/fetch/use-fetch-bot-sources-page";
import { preventDefault, stopPropagation } from "#/helpers/utils";
import { cn } from "#/helpers/class-names";
import { GoogleForm } from "./Forms/GoogleForm/GoogleForm";
import { Switch } from "#/components/switch";
import { titleCase } from "scule";

type Props = {
	action: BotSourceFormAction;
	className?: string;
	source: BotSource;
	setBotSourceBeingEditedOrAdded: React.Dispatch<
		React.SetStateAction<BotSource | null>
	>;
	setNextBotSources: React.Dispatch<React.SetStateAction<BotSource[]>>;
	closeDialog: () => void;
};

type MatchBotSourceEditFormProps = Omit<
	Props,
	"setBotSourceBeingEditedOrAdded"
>;

const SELECT_ITEMS = Object.values(BotSourceType);

export function EditOrCreateBotSourceDialog({
	className,
	action,
	source,
	setBotSourceBeingEditedOrAdded,
	setNextBotSources,
	closeDialog,
}: Props) {
	const [initialValue] = useState(source);

	useFetchBotSourcesPage();

	function handleChangeBotSource(newValue: string) {
		setBotSourceBeingEditedOrAdded(
			(prev) =>
				({
					...prev,
					// Casting here because it can only be of type `BotSourceType`:
					source_type: newValue as BotSourceType,
					// Casting here because `prev` cannot be null at this point:
				}) as BotSource,
		);
	}

	const cannotChangeBotType =
		initialValue.source_type === BotSourceType.Web &&
		action === BotSourceFormAction.Create;

	return (
		<Dialog open onOpenChange={closeDialog}>
			<DialogContent
				className={cn(
					"simple-scrollbar flex max-h-[90vh] min-h-[55vh] w-2/4 flex-col gap-8 rounded-lg border border-border-smooth bg-popover p-4 shadow-lg shadow-black/40 data-[is-web-source=true]:w-[80vw] z-60",
					className,
				)}
				overlayClassName={cn("edit-or-create-bot-source-dialog", className)}
				data-is-web-source={source.source_type === BotSourceType.Web}
				onPointerDownOutside={preventDefault}
				onFocusOutside={preventDefault}
				onWheel={stopPropagation}
			>
				<DialogHeader>
					<DialogTitle>{action} bot source</DialogTitle>

					<DialogDescription></DialogDescription>
				</DialogHeader>

				<form
					className="flex h-full flex-col gap-6 [&_label]:text-sm"
					id={EDIT_OR_CREATE_BOT_SOURCE_FORM_ID}
					onSubmit={preventDefault}
				>
					<label className="flex flex-col gap-1">
						<span className="font-semibold text-sm">Type</span>

						<Select
							disabled={
								action === BotSourceFormAction.Edit || cannotChangeBotType
							}
							onValueChange={handleChangeBotSource}
							defaultValue={source.source_type}
							required
						>
							<SelectTrigger className="gap-2">
								<div className="flex items-center gap-2">
									{matchIcon(source.source_type, "size-4")}

									<SelectValue placeholder="Select bot source type..." />
								</div>
							</SelectTrigger>

							<SelectContent className="z-150">
								{SELECT_ITEMS.map((item) => (
									<SelectItem value={item} key={item}>
										{titleCase(item.toLowerCase())}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</label>

					<label className="flex flex-col gap-1">
						<span className="font-semibold text-sm">Bot source name</span>

						<Input
							name={BOT_NAME_INPUT_NAME}
							defaultValue={source.name}
							required
						/>
					</label>

					<label className="flex flex-col gap-1">
						<span className="font-semibold text-sm">Description</span>

						<StyledTextarea
							name={BOT_SOURCE_DESCRIPTION_INPUT_NAME}
							defaultValue={source.description}
						/>
					</label>

					{action === BotSourceFormAction.Edit ? (
						<fieldset className="flex flex-col gap-1">
							<label className="font-semibold">
								{/* <Input
								className="size-4 max-w-4 bg-transparent"
								name={IS_BOT_SOURCE_ARCHIVED_INPUT_NAME}
								defaultChecked={source.archived}
								type="checkbox"
								/> */}
								Is archived?
							</label>

							<Switch
								defaultChecked={source.archived}
								name={IS_BOT_SOURCE_ARCHIVED_INPUT_NAME}
							/>
						</fieldset>
					) : null}

					<MatchBotSourceEditForm
						setNextBotSources={setNextBotSources}
						closeDialog={closeDialog}
						source={source}
						action={action}
					/>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function MatchBotSourceEditForm({
	action,
	source,
	setNextBotSources,
	closeDialog,
}: MatchBotSourceEditFormProps) {
	switch (source.source_type) {
		case BotSourceType.Slack:
			return (
				<SlackForm
					setNextBotSources={setNextBotSources}
					closeDialog={closeDialog}
					source={source}
					action={action}
				/>
			);

		case BotSourceType.CSV:
		case BotSourceType.PDF:
			return (
				<PDF_Or_CSV_Form
					setNextBotSources={setNextBotSources}
					closeDialog={closeDialog}
					key={source.source_type}
					source={source}
					action={action}
				/>
			);

		case BotSourceType.Web:
			return (
				<WebForm
					setNextBotSources={setNextBotSources}
					closeDialog={closeDialog}
					source={source}
					action={action}
				/>
			);

		case BotSourceType.GoogleDrive:
			return (
				<GoogleForm
					setNextBotSources={setNextBotSources}
					closeDialog={closeDialog}
					source={source}
					action={action}
				/>
			);

		default:
			console.log("Unknown source type:", { source });
			return null;
	}
}
