import { ImagePlugin } from "@platejs/media/react";
import {
	CircleStopIcon,
	Paperclip,
	Send,
	SlidersVertical,
	X,
} from "lucide-react";
import { type ElementOrTextIn, NodeApi } from "platejs";
import {
	type PlateEditor,
	useEditorSelector,
	usePlateEditor,
} from "platejs/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { titleCase } from "scule";

import { LOADER } from "#/components/Button";
import { Loader } from "#/components/Loader";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/Tooltip";
import { useChatStore } from "#/contexts/chat-context";
import {
	generalContextStore,
	ToolSelectionType,
	useUserChatTools,
	useWithBotConversationId,
} from "#/contexts/general-ctx/general-context";
import { useWebsocketStore } from "#/contexts/Websocket/context";
import {
	type ExtraDataForEachMessage,
	sendWebSocketMessage,
} from "#/contexts/Websocket/websocket-state-machine";
import { ExportAsPdfButton } from "#/features/export-as-pdf-button";
import {
	createBotConversationMessageUuid,
	createRequestId,
	fileToBase64,
	getErrorMessage,
	handleDragStart,
	isDev,
	isMacOS,
	isValidNumber,
	log,
	noop,
	OPTIMISTIC_NEW_NOTEBOOK_ID,
	shouldNeverHappen,
	SLATE_DEFAULT_CHILDREN,
} from "#/helpers/utils";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";
import {
	type Message,
	MessageType,
	useAddBotConversationMessage,
} from "#/hooks/mutation/use-add-bot-conversation-message";
import { useIsCreatingNotebook } from "#/hooks/mutation/use-is-creating-notebook";
import { useSendChatFiles } from "#/hooks/mutation/use-send-chat-files";
import { useWithCurrentOrg } from "#/hooks/use-current-organization";
import { useIsOnline } from "#/hooks/use-is-online";
import { matchIcon } from "#/icons/match-icon";
import type { Base64Image, BotConversationId } from "#/types/general";
import { type ChatTools } from "#/types/notebook";
import {
	WebsocketAction,
	type WebSocketStopGenerationPayload,
} from "#/types/websocket";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "./dropdown-menu";
import { messageInputPlugins } from "./plate-message-input/message-input-plugins";
import { PlateMessageInput } from "./plate-message-input/plate-message-input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./select";

function isPlateEditorEmpty(messageInputEditor: PlateEditor): boolean {
	if (!messageInputEditor) return true;

	let isEmpty = true;

	for (const node of messageInputEditor.children) {
		if (node.type === "img") return false;

		const text = NodeApi.string(node);

		if (text.length > 0) {
			isEmpty = false;

			break;
		}
	}

	return isEmpty;
}

const MESSAGE_INPUT_EDITOR_OPTIONS = {
	plugins: messageInputPlugins,
} as const;

export const MessageInput = memo(function MessageInput() {
	const [files, setFiles] = useState<Array<File>>([]);
	const [isSending, setIsSending] = useState(false);

	const addFilesInputRef = useRef<HTMLInputElement>(null);

	const shouldPressEnterToSend = generalContextStore.use.pressEnterToSend();
	const messageInputEditor = usePlateEditor(MESSAGE_INPUT_EDITOR_OPTIONS);
	const toolSelectionType = generalContextStore.use.toolSelectionType();
	const addBotConversationMessage = useAddBotConversationMessage();
	const scrollContainer = useChatStore().use.scrollContainer();
	const botConversationId = useWithBotConversationId();
	const isCreatingNotebook = useIsCreatingNotebook();
	const currentOrganization = useWithCurrentOrg();
	const websocketStore = useWebsocketStore();
	const sendChatFiles = useSendChatFiles();
	const toolsToUse = useUserChatTools();
	const isStreaming = useIsStreaming();
	const isOnline = useIsOnline();
	const isMessageInputEmpty = useEditorSelector(isPlateEditorEmpty, [], {
		id: messageInputEditor.id,
	});

	const isOptimisticBotConversation =
		botConversationId ===
		(OPTIMISTIC_NEW_NOTEBOOK_ID as unknown as BotConversationId);
	const canSendMessage =
		(!isMessageInputEmpty || files.length !== 0) &&
		!isOptimisticBotConversation &&
		!isCreatingNotebook &&
		!isStreaming;

	const isDefaultToolsSelected =
		currentOrganization.default_chat_tools && toolsToUse
			? currentOrganization.default_chat_tools.length === toolsToUse.length &&
				toolsToUse.every((tool) =>
					currentOrganization.default_chat_tools?.includes(tool),
				)
			: false;

	function scrollToBottom() {
		if (scrollContainer) {
			requestAnimationFrame(() => {
				if (scrollContainer) {
					Reflect.set(
						scrollContainer,
						"scrollTop",
						scrollContainer.scrollHeight,
					);
				}
			});
		}
	}

	async function handleSendMessage(): Promise<void> {
		console.log({
			isOptimisticBotConversation,
			isMessageInputEmpty,
			botConversationId,
			canSendMessage,
			isStreaming,
			isSending,
			isOnline,
			files,
		});

		if (isSending || (isMessageInputEmpty && files.length === 0)) return;

		if (!isValidNumber(botConversationId)) {
			shouldNeverHappen(
				"handleSendMessage must be used within a downloaded notebook so that botConversationId can be fetched.",
			);
		}

		if (isOptimisticBotConversation) {
			toast({
				title:
					"Try again in a few seconds. If the problem persists, please refresh the page.",
				description:
					"Can't send message because the chat is still being created.",
				variant: ToastVariant.Destructive,
			});

			return;
		}

		if (!isOnline) {
			toast({
				description: "Can't send message as you don't have internet connection",
				variant: ToastVariant.Destructive,
				title: "You are offline",
			});
		}

		if (isStreaming) {
			toast({
				title:
					"Please wait for the bot to finish processing the previous message.",
			});

			return;
		}

		if (!canSendMessage) {
			log("Can't send message.", {
				filesLength: files.length,
				isMessageInputEmpty,
				isCreatingNotebook,
			});

			toast({
				description: "Please, refresh the page.",
				variant: ToastVariant.Destructive,
				title: "Can't send message",
			});

			return;
		}

		try {
			setIsSending(true);

			// In case the user sends a message along with files,
			// we need to first send the files, then the message.
			if (files.length > 0) {
				await sendChatFiles.mutateAsync({ files });
			}

			const markdown = messageInputEditor.api.markdown.serialize();

			const convertedMessages = convertMarkdownToMessages(markdown);

			if (isDev) {
				console.log({
					currentOrganization,
					convertedMessages,
					toolsToUse,
					markdown,
				});
			}

			if (convertedMessages.length > 0) {
				let tools_to_use: typeof toolsToUse = undefined;

				if (toolSelectionType === ToolSelectionType.SINGLE_SELECT) {
					if (toolsToUse?.[0]) {
						tools_to_use = [toolsToUse[0]];
					}
				} else if (toolSelectionType === ToolSelectionType.MULTI_SELECT) {
					tools_to_use = toolsToUse;
				}

				addBotConversationMessage.mutate({
					uuid: createBotConversationMessageUuid(),
					messages: convertedMessages,
					botConversationId,
					tools_to_use,
				});
			}

			// Clear editor:
			messageInputEditor.tf.reset();

			removeAllFiles();

			requestAnimationFrame(() => {
				scrollToBottom();
			});
		} catch (error) {
			console.error("Error sending message:", error);

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: "Error sending message",
			});
		} finally {
			setIsSending(false);
		}
	}

	function handleStopStreaming() {
		const request_id = createRequestId();
		const messagePayload: WebSocketStopGenerationPayload &
			ExtraDataForEachMessage = {
			message_payload: { stream_uuid: `BOT_CONVERSATION_${botConversationId}` },
			message_type: WebsocketAction.StopStreamingGeneration,
			request_id,
		};

		sendWebSocketMessage(
			websocketStore.actorRef.getSnapshot().context,
			messagePayload,
		);
	}

	async function handleShowFilesPreviewOnMessageInput(
		e: React.ChangeEvent<HTMLInputElement>,
	) {
		const files = [...(e.target.files || [])];

		if (!files || files.length === 0) return;

		await handleAddImageFilesToMessageInput(files);

		setFiles((prev) =>
			prev.concat(files.filter((file) => !file.type.startsWith("image"))),
		);
	}

	function removeAllFiles() {
		setFiles((prev) => {
			prev.forEach((file) => {
				const previewUrl = Reflect.get(file, "previewUrl");

				if (previewUrl) {
					URL.revokeObjectURL(previewUrl);
				}
			});

			return [];
		});

		if (addFilesInputRef.current) {
			addFilesInputRef.current.value = "";
		}
	}

	function removeFile(file: File) {
		setFiles((prev) => {
			const next: typeof prev = [];

			prev.filter((f) => f !== file);

			for (const f of prev) {
				if (f !== file) {
					next.push(f);
				} else {
					const previewUrl = Reflect.get(file, "previewUrl");

					if (previewUrl) {
						URL.revokeObjectURL(previewUrl);
					}
				}
			}

			return next;
		});
	}

	function handleOnKeyDown(e: React.KeyboardEvent) {
		if (shouldPressEnterToSend) {
			if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
				handleSendMessage().catch(noop);
			}
		} else {
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
				handleSendMessage().catch(noop);
			}
		}
	}

	const handleAddImageFilesToMessageInput = useCallback(
		async (files: Array<File>) => {
			const imgFiles = files.filter((file) => file.type.startsWith("image"));
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const imageNodes: Array<ElementOrTextIn<any>> = [];

			for (const file of imgFiles) {
				const base64Image = (await fileToBase64(file)) as Base64Image;

				const imageNode = {
					children: SLATE_DEFAULT_CHILDREN,
					type: ImagePlugin.key,
					url: base64Image,
				};

				imageNodes.push(imageNode);
			}

			console.log("handleAddImageFilesToMessageInput", { files, imageNodes });

			messageInputEditor.tf.insertNodes(imageNodes);
		},
		[messageInputEditor.tf],
	);

	useEffect(
		function handleDroppedFiles() {
			const abortController = new AbortController();
			const options: AddEventListenerOptions = {
				signal: abortController.signal,
			};

			async function handleDroppedFiles(event: DragEvent) {
				event.stopPropagation();
				event.preventDefault();

				if (!event.dataTransfer) return;

				const files = [...event.dataTransfer.files];

				if (!files || files.length === 0) return;

				await handleAddImageFilesToMessageInput(files);

				setFiles((prev) =>
					prev.concat(files.filter((file) => !file.type.startsWith("image"))),
				);
			}

			// If you want to allow a drop, you must prevent the default behavior by cancelling both the dragenter and dragover events.
			window.addEventListener("dragstart", handleDragStart, options);
			window.addEventListener("dragenter", handleDragStart, options);
			window.addEventListener("dragover", handleDragStart, options);
			window.addEventListener("drop", handleDroppedFiles, options);

			return () => {
				abortController.abort();
			};
		},
		[handleAddImageFilesToMessageInput],
	);

	function handleClickOnTool(tool: ChatTools) {
		generalContextStore.setState((prev) => {
			const orgId = currentOrganization.id;

			if (toolSelectionType === ToolSelectionType.SINGLE_SELECT) {
				return {
					userChatTools: {
						...prev.userChatTools,
						[orgId]: [tool],
					},
				};
			} else {
				const newSet = new Set(prev.userChatTools[orgId]);

				if (newSet.has(tool)) {
					newSet.delete(tool);
				} else {
					newSet.add(tool);
				}

				return {
					userChatTools: {
						...prev.userChatTools,
						[orgId]: [...newSet],
					},
				};
			}
		});
	}

	function selectDefaultChatToolsToUse() {
		generalContextStore.setState((prev) => ({
			userChatTools: {
				...prev.userChatTools,
				[currentOrganization.id]: currentOrganization.default_chat_tools,
			},
		}));
	}

	return (
		<div
			className="relative flex flex-col chat-content gap-2 py-1 overflow-hidden w-full"
			data-no-print
		>
			<div
				className="flex h-full items-center overflow-clip rounded-xl border-[1.5px] border-gray-600 data-[is-streaming=true]:border-none data-[is-streaming=true]:p-[1.5px] data-[is-streaming=true]:animate-background bg-gradient-to-r from-green-300 via-blue-600 to-red-300 bg-[length:_400%_400%]"
				data-is-streaming={isStreaming}
			>
				<div className="relative flex flex-col w-full h-full bg-secondary rounded-[calc(var(--radius-2xl)-6px)] p-2">
					<div className="flex flex-col gap-2 w-full">
						<PlateMessageInput
							editor={messageInputEditor}
							onKeyDown={handleOnKeyDown}
						/>

						{files.length > 0 ? (
							<div className="flex simple-scrollbar max-h-96 min-h-10 scrollbar-stable scrollbar-both-edges gap-4">
								{files.map((file, index) => {
									const isImage = file.type.startsWith("image");
									const previewUrl: string | undefined =
										isImage && Reflect.get(file, "previewUrl");

									if (isImage && previewUrl) {
										return (
											<div
												className="relative flex flex-col flex-none gap-2 p-2 items-center group w-52 h-auto rounded-md border border-border-smooth"
												key={index}
											>
												<button
													className="absolute p-0.5 hover:bg-slate-100 bg-slate-300 active:bg-slate-500 -right-2 top-[calc(50%-8px)] invisible group-hover:visible rounded-full"
													onClick={() => removeFile(file)}
													title="Remove file"
													type="button"
												>
													<X className="size-3 stroke-black" />
												</button>

												<img
													className="rounded-sm"
													src={previewUrl}
													alt="Preview"
												/>
											</div>
										);
									}

									return (
										<div
											className="relative flex flex-none gap-2 p-2 items-center group w-52 h-10 rounded-md border border-border-smooth "
											key={index}
										>
											<button
												className="absolute p-0.5 hover:bg-slate-100 bg-slate-300 active:bg-slate-500 -right-2 top-[calc(50%-8px)] invisible group-hover:visible rounded-full"
												onClick={() => removeFile(file)}
												title="Remove file"
												type="button"
											>
												<X className="size-3 stroke-black" />
											</button>

											{matchIcon(file.type)}

											<p className="truncate" title={file.name}>
												{file.name}
											</p>
										</div>
									);
								})}
							</div>
						) : null}

						<div className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-2">
								<button
									className="flex aspect-square h-10 items-center justify-center rounded-lg button-hover disabled:opacity-50"
									disabled={isStreaming || isSending}
									type="button"
									onClick={() =>
										isStreaming || isSending
											? undefined
											: addFilesInputRef.current?.click()
									}
									title={
										isStreaming
											? "Cannot upload files while streaming"
											: "Click to add CSV/PDF files"
									}
								>
									<Paperclip className="size-4" />

									<input
										onChange={handleShowFilesPreviewOnMessageInput}
										accept=".csv,.pdf,image/*"
										ref={addFilesInputRef}
										className="hidden"
										type="file"
										multiple
									/>
								</button>

								{currentOrganization.all_tool_options && toolsToUse ? (
									toolSelectionType === ToolSelectionType.SINGLE_SELECT ? (
										<Select
											onValueChange={handleClickOnTool}
											value={toolsToUse[0]!}
										>
											<SelectTrigger
												className="flex items-center justify-center h-10 min-w-10 button-hover gap-2 p-2 text-sm rounded-lg border-none shadow-none"
												title="Mode"
											>
												{toolsToUse[0] ? (
													<>
														{matchIcon(toolsToUse[0])}

														<span className="capitalize text-xs text-muted">
															{titleCase(toolsToUse[0].toLowerCase())}
														</span>
													</>
												) : (
													<>
														<SlidersVertical className="size-4 text-muted" />

														<span>Mode</span>
													</>
												)}
											</SelectTrigger>

											<SelectContent align="start">
												{currentOrganization.all_tool_options.map((tool) => (
													<SelectItem
														className="flex flex-row items-center gap-2 group"
														value={tool}
														key={tool}
													>
														<div className="flex flex-row items-center gap-2">
															{matchIcon(
																tool,
																"group-focus:stroke-accent-foreground",
															)}

															<span className="capitalize">
																{titleCase(tool.toLowerCase())}
															</span>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : (
										<DropdownMenu>
											<DropdownMenuTrigger
												className="flex items-center justify-center h-10 min-w-10 button-hover gap-2 p-2 text-sm rounded-lg border-none shadow-none"
												title="Mode"
											>
												{isDefaultToolsSelected ? (
													<>
														<SlidersVertical className="size-4 text-primary" />

														<span className="text-muted text-xs">Default</span>
													</>
												) : toolsToUse[0] ? (
													<>
														{matchIcon(toolsToUse[0])}

														<span className="capitalize text-xs text-muted">
															{titleCase(toolsToUse[0].toLowerCase())}
														</span>
													</>
												) : (
													<>
														<SlidersVertical className="size-4 text-primary" />

														<span>Mode</span>
													</>
												)}
											</DropdownMenuTrigger>

											<DropdownMenuContent align="start">
												{currentOrganization.all_tool_options.map((tool) => (
													<DropdownMenuCheckboxItem
														className="group focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
														onCheckedChange={() => handleClickOnTool(tool)}
														checked={toolsToUse.includes(tool)}
														key={tool}
													>
														{matchIcon(
															tool,
															"group-focus:stroke-accent-foreground",
														)}

														<span className="capitalize">
															{titleCase(tool.toLowerCase())}
														</span>
													</DropdownMenuCheckboxItem>
												))}

												<DropdownMenuCheckboxItem
													onCheckedChange={selectDefaultChatToolsToUse}
													checked={isDefaultToolsSelected}
												>
													Default
												</DropdownMenuCheckboxItem>
											</DropdownMenuContent>
										</DropdownMenu>
									)
								) : null}
							</div>

							<Tooltip>
								<TooltipTrigger
									className="flex aspect-square h-10 items-center justify-center rounded-lg bg-green-700 border-2 border-transparent hover:bg-green-600 active:bg-green-800 data-[is-streaming=true]:border-orange-400/80 data-[is-streaming=true]:hover:bg-destructive/60 data-[is-streaming=true]:active:bg-destructive/80 data-[is-streaming=true]:rounded-full data-[is-streaming=true]:bg-destructive mt-auto disabled:opacity-50"
									onClick={
										isStreaming ? handleStopStreaming : handleSendMessage
									}
									data-is-streaming={isStreaming}
									title={
										canSendMessage
											? "Send message"
											: isStreaming
												? "Please, wait for the bot to finish processing the previous message or click this to stop generating"
												: "Unable to send message for unknown reason"
									}
								>
									{isSending ? (
										<Loader className="size-4 border-t-white" />
									) : isStreaming ? (
										<CircleStopIcon className="size-4 text-white" />
									) : (
										<Send className="size-4 text-white" />
									)}
								</TooltipTrigger>

								{isStreaming ? (
									<TooltipContent
										className="w-fit max-h-28 simple-scrollbar text-primary"
										align="end"
									>
										Stop generation
									</TooltipContent>
								) : null}
							</Tooltip>
						</div>
					</div>

					{isSending ? (
						<div className="absolute flex items-center justify-center inset-1 rounded-lg z-20 bg-white/20 text-white backdrop-blur-xs gap-2">
							<p>Sending…</p>

							{LOADER}
						</div>
					) : null}
				</div>
			</div>

			<div className="flex justify-between pb-1">
				<div className="flex gap-2 items-center">
					<ExportAsPdfButton />
				</div>

				<p className="text-xs text-primary">
					Press&nbsp;
					<span className="rounded-sm bg-muted-strong py-0.5 px-1 font-bold">
						{shouldPressEnterToSend ? null : isMacOS() ? "Cmd + " : "Ctrl + "}
						Enter
					</span>
					&nbsp;to send message.
				</p>
			</div>
		</div>
	);
});

const SPACES_REGEX = /([\s\u200B\u00A0\uFEFF]|<br>|&nbsp;|&#x20;|\\n|)+/;
const SPACES_REGEX_AT_END_AND_START = new RegExp(
	`^${SPACES_REGEX.source}|${SPACES_REGEX.source}$`,
	"gi",
);

function trimWhitespace(str: string): string {
	// Use the regex to replace matches with an empty string
	// The 'g' flag is important to replace all occurrences, not just the first one found by the pattern.
	// Although in this specific case (beginning/end), the pattern itself ensures we target those boundaries.
	SPACES_REGEX_AT_END_AND_START.lastIndex = 0;

	return str.replaceAll(SPACES_REGEX_AT_END_AND_START, "").trim();
}

const MARKDOWN_IMAGE_REGEX =
	/!\[.*?\]\((data:image\/[^;]+;base64,[A-Z0-9+/=]+)\)/gi;

function convertMarkdownToMessages(markdown: string): Array<Message> {
	MARKDOWN_IMAGE_REGEX.lastIndex = 0;

	const splitText = markdown.split(MARKDOWN_IMAGE_REGEX);

	const messages = splitText
		.map((text, index) => {
			const trimmedText = trimWhitespace(text);

			if (trimmedText.length === 0) return null;

			// Odd indexes are images based on spliting the text by image regex:
			const isImage = index % 2 === 1;

			if (isImage) {
				const msg: Message = {
					uuid: createBotConversationMessageUuid(),
					image: trimmedText as Base64Image,
					type: MessageType.Image,
				};

				return msg;
			} else {
				const msg: Message = {
					uuid: createBotConversationMessageUuid(),
					type: MessageType.Text,
					text: trimmedText,
				};

				return msg;
			}
		})
		.filter(Boolean) as Array<Message>;

	return messages;
}
