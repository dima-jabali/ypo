import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/Dialog";
import { Input } from "#/components/Input";
import { StyledTextarea } from "#/components/styled-text-area";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { useCreateBot } from "#/hooks/mutation/use-create-bot";
import { useCreateBotCommunication } from "#/hooks/mutation/use-create-bot-communication";
import { useCreateBotCommunicationConfig } from "#/hooks/mutation/use-create-bot-communication-config";
import { useCurrentOrganization } from "#/hooks/use-current-organization";
import {
	BotCommunicationType,
	BotType,
	ChannelConfigType,
} from "#/types/bot-source";
import type { SlackConnectionDataWithDefinedChannels } from "#/types/databases";

type Props = {
	connection?: SlackConnectionDataWithDefinedChannels;
};

export const BOT_DESCRIPTION_INPUT_NAME = "bot-description";
export const BOT_NAME_INPUT_NAME = "bot-name";

export function CreateBotDialog({ connection }: Props) {
	const currentOrganization = useCurrentOrganization();

	// const allBotTags: BotTag[] = []; // TODO

	// const [selectedTags, setSelectedTags] = useState<BotTag[]>([]);
	const [isCreatingBot, setIsCreatingBot] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const createBotCommunicationConfig = useCreateBotCommunicationConfig();
	const createBotCommunication = useCreateBotCommunication();
	const createBotMutation = useCreateBot();

	const handleCreateSlackBot = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!currentOrganization) {
			toast({
				title: "You don't organization selected!",
				variant: ToastVariant.Destructive,
			});

			return;
		}

		// Casting here because `e.target` can only be an `HTMLFormElement`:
		const formData = new FormData(e.target as HTMLFormElement);

		// Casting here cause we know it is a string:
		const botDescription =
			(formData.get(BOT_DESCRIPTION_INPUT_NAME) as string | null)?.trim() ?? "";

		// Casting here cause we know it is a string:
		const botName = (
			formData.get(BOT_NAME_INPUT_NAME) as string | null
		)?.trim();

		if (!botName) {
			toast({
				title: "Please enter a bot name!",
				variant: ToastVariant.Destructive,
			});

			return;
		}

		try {
			setIsCreatingBot(true);

			const newBot = await createBotMutation.mutateAsync({
				communication_type: BotCommunicationType.Slack,
				type: BotType.QuestionsAndAnswers,
				description: botDescription,
				name: botName,
			});

			console.log("createBot response: ", { newBot, connection });

			setIsDialogOpen(false);

			if (connection) {
				const newCommConfig = await createBotCommunicationConfig.mutateAsync({
					channel_config_type: ChannelConfigType.Selected,
					communication_type: BotCommunicationType.Slack,
					slack_connection_id: connection.id,
					allowed_slack_channel_ids: [],
					bot_id: newBot.id,
				});

				console.log({ newCommConfig });

				//                 const newBotWithCommConfig: Bot = {
				//                     ...newBot,
				//                     communication_configs: [...newBot.communication_configs, newCommConfig],
				//                 };
				//                 const newConnectionWithBot: typeof connection = {
				//                     ...connection,
				//                 };
				//
				//                 console.log({ newBotWithCommConfig });

				// setBotDatabaseConnection(newConnectionWithBot));
			}

			// Create a default Chat channel (BotConversation) to talk with the bot:
			const newBotConversation = await createBotCommunication.mutateAsync({
				botId: newBot.id,
				title: "Hello!",
			});

			console.log({ newBotConversation });

			toast({
				title: "Bot created successfully!",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			console.error("Failed to create bot:", error);

			toast({
				title: "Failed to create bot!",
				variant: ToastVariant.Destructive,
			});
		} finally {
			setIsCreatingBot(false);
		}
	};

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button variant={ButtonVariant.PURPLE}>
					<PlusIcon className="size-5" />

					<p>Create</p>
				</Button>
			</DialogTrigger>

			<DialogContent className="simple-scrollbar">
				<DialogHeader>
					<DialogTitle className="pl-2">Create Bot</DialogTitle>
				</DialogHeader>

				<form
					className="mt-10 flex h-[92%] flex-col gap-5"
					onSubmit={handleCreateSlackBot}
				>
					<label className="flex flex-col gap-1">
						<p className="pl-2">
							Name
							<span className="align-top text-sm text-destructive ml-1">*</span>
						</p>

						<Input name={BOT_NAME_INPUT_NAME} />
					</label>

					<label className="flex flex-col gap-1">
						<p className="pl-2">Description</p>

						<StyledTextarea name={BOT_DESCRIPTION_INPUT_NAME} />
					</label>

					{/* <label className="flex flex-col gap-1">
                        <p className="pl-2">Tags</p>

                        <TagGroup
                            renderRemovableItem={renderRemovableBotTagItem}
                            noMoreItemsToSelect={NO_MORE_ITEMS_TO_SELECT}
                            setSelectedValues={setSelectedTags}
                            placeholder="Search bot tags..."
                            renderItem={renderBotTagItem}
                            selectedValues={selectedTags}
                            allValues={allBotTags}
                            withSearch
                            isMulti
                        />
                    </label> */}

					<DialogFooter className="">
						<Button
							variant={ButtonVariant.SUCCESS}
							isLoading={isCreatingBot}
							type="submit"
						>
							Creat{isCreatingBot ? "ing" : "e"} Bot{isCreatingBot ? "..." : ""}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// const renderBotTagItem: TagGroupProps<BotTag>['renderItem'] = (item, handleAddSelectedValue) => (
//     <div key={item.name}>
//         <button
//             className="w-full bg-slate-600 p-2 transition-none onfocus:bg-blue-400/40"
//             onPointerUp={() => handleAddSelectedValue(item)}>
//             <span className="relative box-border flex w-min items-center justify-center overflow-hidden whitespace-nowrap rounded-sm px-2 py-1">
//                 {item.name}
//             </span>
//         </button>
//     </div>
// );
//
// const renderRemovableBotTagItem: TagGroupProps<BotTag>['renderRemovableItem'] = (
//     item,
//     index,
//     handleRemoveSelectedValue
// ) => (
//     <div /* Selected item container */
//         className="relative box-border flex w-min items-center justify-center overflow-hidden rounded-sm bg-slate-600"
//         key={item.name}>
//         <p className="whitespace-nowrap px-2">{item.name}</p>
//
//         <button /* Remove item button */
//             className="h-full p-2 transition-none onfocus:bg-destructive/80 onfocus:text-primary"
//             onPointerUp={() => handleRemoveSelectedValue(index)}
//             type="button">
//             <XMarkIcon className="size-4" />
//         </button>
//     </div>
// );
