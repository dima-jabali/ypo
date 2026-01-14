import { useMachine } from "@xstate/react";
import { useWebSocket } from "partysocket/react";
import { type PropsWithChildren, useEffect, useMemo } from "react";

import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import {
	generalContextStore,
	SidebarTab,
} from "#/contexts/general-ctx/general-context";
import { WebsocketContext } from "#/contexts/Websocket/context";
import { websocketStateMachine } from "#/contexts/Websocket/websocket-state-machine";
import {
	isDev,
	isValidNumber,
	OPTIMISTIC_NEW_NOTEBOOK_ID,
	stringifyUnknown,
} from "#/helpers/utils";
import {
	WebsocketEvent,
	WebSocketAuthStatus,
	type WebSocketEventData,
} from "#/types/websocket";
import { applyPatchUpdateResponsesToBatchTable } from "#/features/sapien/lib/apply-updates-to-batch-table";
import type { FileId } from "#/types/general";
import { allEditorsInfo } from "../monaco-editors-info";
import { applyNotebookResponseUpdates } from "#/helpers/apply-notebook-response-updates";

const WEBSOCKET_URL = import.meta.env.VITE_PUBLIC_WEBSOCKET_BACKEND_URL as
	| string
	| undefined;

if (!WEBSOCKET_URL) {
	throw new Error(
		"import.meta.env.VITE_PUBLIC_WEBSOCKET_BACKEND_URL is not defined",
	);
}

function WebsocketProviderInner({ children }: PropsWithChildren) {
	const generalStoreBotConversationId =
		generalContextStore.use.botConversationId();
	const generalStoreNotebookId = generalContextStore.use.notebookId();
	const organizationId = generalContextStore.use.organizationId();
	const batchTableId = generalContextStore.use.batchTableId();

	const [snapshot, send, actorRef] = useMachine(websocketStateMachine);

	useEffect(() => {
		const isOptimisticNotebook =
			generalStoreNotebookId === OPTIMISTIC_NEW_NOTEBOOK_ID;

		console.log({
			generalStoreBotConversationId,
			generalStoreNotebookId,
			isOptimisticNotebook,
			batchTableId,
		});

		if (isOptimisticNotebook) return;

		if (isValidNumber(batchTableId)) {
			send({
				type: "subscribe-to-batch-table",
				batchTableId,
			});
		}

		if (
			isValidNumber(generalStoreBotConversationId) &&
			isValidNumber(generalStoreNotebookId)
		) {
			send({
				type: "subscribe-to-notebook-and-bot-conversation",
				botConversationId: generalStoreBotConversationId,
				notebookId: generalStoreNotebookId,
			});
		}
	}, [
		generalStoreBotConversationId,
		generalStoreNotebookId,
		batchTableId,
		send,
	]);

	useEffect(() => {
		const unsub = actorRef.subscribe({
			error(err) {
				console.error("Websocket state machine error:", err);
			},
		});

		return () => {
			unsub.unsubscribe();
		};
	}, [snapshot, actorRef]);

	const websocket = useWebSocket(WEBSOCKET_URL!, undefined, {
		debug: isDev,

		onOpen() {
			console.log("Websocket connection opened");

			send({ type: "set=websocket", websocket });
		},

		onClose(event) {
			console.error("Websocket closed. Event:", stringifyUnknown(event, 0));

			send({ type: "go-to=closed" });
		},

		onError(event) {
			console.error("WebSocket error. Event:", stringifyUnknown(event, 0));
		},

		onMessage(event) {
			try {
				const data: WebSocketEventData = JSON.parse(event.data);

				switch (data.message_type) {
					case WebsocketEvent.CheckAuthResponse: {
						if (
							data.message_payload.is_authenticated ||
							data.message_payload.is_authorized
						) {
							if (
								!isValidNumber(generalStoreBotConversationId) &&
								!isValidNumber(generalStoreNotebookId) &&
								!isValidNumber(batchTableId)
							) {
								send({
									type: "go-to=idle",
								});

								break;
							}

							send({
								type: isValidNumber(batchTableId)
									? "go-to=subscribing-to-batch-table"
									: "go-to=subscribing-to-notebook-and-bot-conversation",
							});

							break;
						}

						send({ type: "go-to=authenticating" });

						break;
					}

					case WebsocketEvent.AuthResponse: {
						const isWebsocketAuthenticated =
							data.message_payload.status === WebSocketAuthStatus.Success;

						if (isWebsocketAuthenticated) {
							if (
								!isValidNumber(generalStoreBotConversationId) &&
								!isValidNumber(generalStoreNotebookId) &&
								!isValidNumber(batchTableId)
							) {
								send({
									type: "go-to=idle",
								});

								break;
							}

							send({
								type: isValidNumber(batchTableId)
									? "go-to=subscribing-to-batch-table"
									: "go-to=subscribing-to-notebook-and-bot-conversation",
							});
						} else {
							console.log(
								"%cWebsocket authentication failed!",
								"background-color: red; padding: 2px 10px; color: white; font-weight: 700;",
								event,
							);

							send({ type: "go-to=authenticating" });
						}

						break;
					}

					case WebsocketEvent.PatchProjectResponse: {
						if (
							isValidNumber(data.message_payload.project_id) &&
							isValidNumber(data.message_payload.bot_conversation_id)
						) {
							applyNotebookResponseUpdates({
								organizationId,
								response: {
									bot_conversation_id: data.message_payload.bot_conversation_id,
									project_id: data.message_payload.project_id,
									timestamp: data.message_payload.timestamp,
									updates: data.message_payload.updates,
								},
							});
						}

						break;
					}

					case WebsocketEvent.SubscribeProjectResponse: {
						const hasSubscribed =
							data.message_payload.status === WebSocketAuthStatus.Success;

						const notebookId = generalContextStore.getState().notebookId;

						if (!isValidNumber(notebookId)) {
							console.error("Notebook ID is not valid", { notebookId });

							break;
						}

						if (hasSubscribed) {
							console.log(
								`%cSubscribed to project of id \`${notebookId}\`!`,
								"background-color: green; color: white; padding: 2px;",
							);

							send({ type: "set=subscribed-to-notebook", notebookId });
						} else {
							toast({
								title: `Failed to connect to WebSocket for project with ID: \`${notebookId}\`!`,
								description: "Please refresh the page.",
								variant: ToastVariant.Destructive,
							});

							console.log(
								`%cFailed to subscribe to project of id \`${notebookId}\`!`,
								"background-color: red; color: white; padding: 2px;",
							);
						}

						break;
					}

					case WebsocketEvent.SubscribeBotConversationResponse: {
						const hasSubscribed =
							data.message_payload.status === WebSocketAuthStatus.Success;

						const botConversationId =
							generalContextStore.getState().botConversationId;

						if (!isValidNumber(botConversationId)) {
							console.error("botConversationId is not valid", {
								botConversationId,
							});

							break;
						}

						if (hasSubscribed) {
							console.log(
								`%cSubscribed to bot conversation of id \`${botConversationId}\`!`,
								"background-color: green; color: white; padding: 2px;",
							);

							send({
								type: "set=subscribed-to-bot-conversation",
								botConversationId,
							});
						} else {
							toast({
								title: "Failed to connect to WebSocket!",
								description: "Please refresh the page.",
								variant: ToastVariant.Destructive,
							});

							console.log(
								`%cFailed to subscribe to bot conversation of id \`${botConversationId}\`!`,
								"background-color: red; color: white; padding: 2px;",
							);
						}

						break;
					}

					case WebsocketEvent.UnsubscribeProjectResponse: {
						const hasUnsubscribed =
							data.message_payload.status === WebSocketAuthStatus.Success;

						if (hasUnsubscribed) {
							console.log(
								`%cUnsubscribed from some project!`,
								"background-color: blue; color: white; padding: 2px;",
							);
						} else {
							console.log(
								`%cFailed to unsubscribe from some project!`,
								"background-color: red; color: white; padding: 2px;",
							);
						}

						break;
					}

					case WebsocketEvent.UnsubscribeBotConversationResponse: {
						const hasUnsubscribed =
							data.message_payload.status === WebSocketAuthStatus.Success;

						if (hasUnsubscribed) {
							console.log(
								`%cUnsubscribed from some bot conversation!`,
								"background-color: blue; color: white; padding: 2px;",
							);
						} else {
							console.log(
								`%cFailed to unsubscribe from some bot conversation!`,
								"background-color: red; color: white; padding: 2px;",
							);
						}

						break;
					}

					case WebsocketEvent.SqlAutocompleteResponse: {
						const editorData = allEditorsInfo.get(
							data.message_payload.editor_model_id,
						);

						if (!editorData) {
							console.log(
								"%cNo `editorData` found in SingletonWebsocketConnection:",
								"background-color: red; padding: 2px 10px; color: white; font-weight: 700;",
								{ data },
							);

							break;
						}
						if (!editorData.monacoEditor) {
							console.log(
								"%cNo `monacoEditor` found in `editorData`!",
								"background-color: red; padding: 2px 10px; color: white; font-weight: 700;",
							);

							break;
						}

						editorData.serverSuggestionsResponse = data.message_payload;

						editorData.monacoEditor.trigger(
							"close-already-open-suggestion-widget",
							"hideSuggestWidget",
							null,
						);

						editorData.monacoEditor.trigger(
							"trigger-autocomplete-with-websocket-data",
							"editor.action.triggerSuggest",
							{ auto: true },
						);

						break;
					}

					// [Start] Sapien:

					case WebsocketEvent.SubscribeBatchTableOutputs: {
						const hasSubscribed =
							data.message_payload.status === WebSocketAuthStatus.Success;

						if (!isValidNumber(batchTableId)) {
							console.error("batchTableId is not valid", { batchTableId });

							break;
						}

						if (hasSubscribed) {
							console.log(
								`%cSubscribed to batch table of id \`${batchTableId}\`!`,
								"background-color: green; color: white; padding: 2px;",
							);

							send({ type: "set=subscribed-to-batch-table", batchTableId });
						} else {
							toast({
								title: `Failed to connect to WebSocket for batch table with ID: \`${batchTableId}\`!`,
								description: "Please refresh the page.",
								variant: ToastVariant.Destructive,
							});

							console.log(
								`%cFailed to subscribe to batch table of id \`${batchTableId}\`!`,
								"background-color: red; color: white; padding: 2px;",
							);
						}

						break;
					}

					case WebsocketEvent.RelevantQueries: {
						const notebook = generalContextStore
							.getState()
							.getNotebook(data.message_payload.project_id);

						if (notebook) {
							const blockUuid = data.message_payload.block_uuid;
							const block = notebook.blocks.find(
								({ uuid }) => uuid === blockUuid,
							);

							if (block) {
								generalContextStore.setState({
									similarQueriesToShow: {
										similarQueries: data.message_payload.queries,
										block,
									},
									sidebarTab: SidebarTab.Outline,
									keepSidebarOpen: true,
								});
							} else {
								console.log("Block not found in current notebook", {
									notebook,
									data,
								});
							}
						} else {
							console.log("Notebook not found", { data });
						}

						break;
					}

					case WebsocketEvent.UnsubscribeBatchTableOutputs: {
						const hasUnsubscribed =
							data.message_payload.status === WebSocketAuthStatus.Success;

						if (hasUnsubscribed) {
							console.log(
								`%cUnsubscribed from some batch table!`,
								"background-color: blue; color: white; padding: 2px;",
							);
						} else {
							console.log(
								`%cFailed to unsubscribe from some batch table!`,
								"background-color: red; color: white; padding: 2px;",
							);
						}

						break;
					}

					case WebsocketEvent.PatchBatchTableWSMessage: {
						applyPatchUpdateResponsesToBatchTable({
							batchTableId: data.message_payload.batch_table_id,
							updates: data.message_payload.updates,
							organizationId,
						});

						break;
					}

					// [End] Sapien

					case WebsocketEvent.UnsubscribeFileResponse:
					case WebsocketEvent.SubscribeFileResponse:
					case WebsocketEvent.StatusMessage: {
						break;
					}

					default: {
						console.log(
							"%cUnknown message type in websocket onMessage:",
							"background-color: red; padding: 2px 10px; color: white; font-weight: 700;",
							{ data, event },
						);
						break;
					}
				}
			} catch (error) {
				console.error("Error in websocket onMessage:", { error, event });
			}
		},
	});

	const providerValue = useMemo(
		() => ({
			actorRef,
			tryToSubscribeToFileUpdates(fileId: FileId) {
				console.warn(
					"[UNIMPLEMENTED] Trying to subscribe to file updates",
					fileId,
				);
				// actorRef.send({type: "subscribe-to-file-updates", fileId});
			},
		}),
		[actorRef],
	);

	return (
		<WebsocketContext.Provider value={providerValue}>
			{children}
		</WebsocketContext.Provider>
	);
}

export function WebsocketProvider({ children }: PropsWithChildren) {
	const organizationId = generalContextStore.use.organizationId();

	return (
		<WebsocketProviderInner key={organizationId}>
			{children}
		</WebsocketProviderInner>
	);
}
