import { WebSocket } from "partysocket";
import { assign, fromPromise, log, setup, type EventObject } from "xstate";

import { AuthTokenType, getAuthToken } from "#/api";
import {
	createISODate,
	createRequestId,
	createUUID,
	isValidNumber,
	sleep,
} from "#/helpers/utils";
import type {
	BatchTableId,
	BotConversationId,
	ISODateString,
	NotebookId,
	UUID,
} from "#/types/general";
import {
	WebsocketAction,
	type RequestId,
	type WebSocketActionData,
	type WebSocketActionPayload,
	type WebSocketAuthPayload,
	type WebSocketSubscribeBatchTableInputsPayload,
	type WebSocketSubscribeConversationPayload,
	type WebSocketSubscribeProjectPayload,
	type WebSocketUnsubscribeBatchTableInputsPayload,
	type WebSocketUnsubscribeConversationPayload,
	type WebSocketUnsubscribeProjectPayload,
} from "#/types/websocket";

type WebsocketMachineContext = {
	botConversationId: BotConversationId | null;
	isSubscribedToBotConversation: boolean;
	batchTableId: BatchTableId | null;
	isSubscribedToBatchTable: boolean;
	isSubscribedToNotebook: boolean;
	notebookId: NotebookId | null;
	websocket: WebSocket | null;
	isAuthenticated: boolean;
	uuid: UUID;
};

export type ExtraDataForEachMessage = {
	request_id: RequestId;
};

type WebsocketMachineEvents = EventObject &
	(
		| {
				type: "set=websocket";
				websocket: WebSocket;
		  }
		| {
				type: "subscribe-to-notebook-and-bot-conversation";
				botConversationId: BotConversationId;
				notebookId: NotebookId;
		  }
		| {
				type: "set=subscribed-to-bot-conversation";
				botConversationId: BotConversationId;
		  }
		| {
				type: "subscribe-to-batch-table";
				batchTableId: BatchTableId;
		  }
		| {
				type: "set=subscribed-to-batch-table";
				batchTableId: BatchTableId;
		  }
		| { type: "set=subscribed-to-notebook"; notebookId: NotebookId }
		| { type: "go-to=subscribing-to-notebook-and-bot-conversation" }
		| { type: "go-to=subscribing-to-file-updates" }
		| { type: "go-to=subscribing-to-batch-table" }
		| { type: "go-to=authenticating" }
		| { type: "go-to=closed" }
		| { type: "go-to=idle" }
	);

export function sendWebSocketMessage(
	context: WebsocketMachineContext,
	message: WebSocketActionPayload & ExtraDataForEachMessage,
) {
	if (!context.websocket) {
		console.log(
			"%c`websocket` is null! Cannot send message! Have you called `getInstance` first?",
			"background-color: red; padding: 2px 10px; color: white; font-weight: 700;",
		);
		console.log("Tried sending message payload:", message);

		return;
	}

	const messageWithExtraData: WebSocketActionData & ExtraDataForEachMessage = {
		...message,
		timestamp: new Date().toISOString() as ISODateString,
		tab_id: context.uuid,
	};

	context.websocket.send(JSON.stringify(messageWithExtraData));
}

type WebsocketStateMachineSend = (event: WebsocketMachineEvents) => void;

const authenticateActor = fromPromise(
	async ({
		input,
	}: {
		input: {
			context: WebsocketMachineContext;
			send: WebsocketStateMachineSend;
		};
	}) => {
		if (!input.context.websocket) {
			console.error("WebSocket is not defined on authenticateActor");

			await sleep(1_000);

			input.send({ type: "go-to=authenticating" });

			return;
		}

		const request_id = createRequestId();

		const token = await getAuthToken();

		if (!token.token) {
			const msg = "Token is not defined on notebook WebSocket";

			console.error(msg);

			input.context.websocket.close(1000, msg);

			await sleep(1_000);

			input.send({ type: "go-to=authenticating" });

			return;
		}

		const messagePayload: WebSocketAuthPayload &
			WebSocketActionData &
			ExtraDataForEachMessage = {
			message_payload: {
				[token.type === AuthTokenType.Bearer ? "token" : "api_key"]:
					token.token,
			},
			message_type: WebsocketAction.Auth,
			tab_id: input.context.uuid,
			timestamp: createISODate(),
			request_id,
		};

		console.log("Authenticating notebook WebSocket…");

		input.context.websocket.send(JSON.stringify(messagePayload));
	},
);

const subscribeToNotebookActor = fromPromise(
	async ({
		input,
	}: {
		input: {
			context: WebsocketMachineContext;
			send: WebsocketStateMachineSend;
		};
	}) => {
		console.log("Subscribing to notebook WebSocket updates…", {
			botConversationId: input.context.botConversationId,
			isAuthenticated: input.context.isAuthenticated,
			notebookId: input.context.notebookId,
		});

		if (!input.context.isAuthenticated) {
			input.send({ type: "go-to=authenticating" });

			return;
		}

		if (
			!(
				isValidNumber(input.context.botConversationId) &&
				isValidNumber(input.context.notebookId)
			)
		) {
			// Let's try again later.

			// await sleep(1_000);
			console.log("Invalid notebookId or botConversationId. Going to idle.");

			input.send({
				type: "go-to=idle",
			});

			return;
		}

		const subscribeProjectMessagePayload: WebSocketSubscribeProjectPayload &
			ExtraDataForEachMessage = {
			message_payload: { project_id: input.context.notebookId },
			message_type: WebsocketAction.SubscribeProject,
			request_id: createRequestId(),
		};

		sendWebSocketMessage(input.context, subscribeProjectMessagePayload);

		const subscribeConversationMessagePayload: WebSocketSubscribeConversationPayload &
			ExtraDataForEachMessage = {
			message_type: WebsocketAction.SubscribeBotConversation,
			message_payload: {
				bot_conversation_id: input.context.botConversationId,
			},
			request_id: createRequestId(),
		};

		sendWebSocketMessage(input.context, subscribeConversationMessagePayload);
	},
);

const subscribeToBatchTableActor = fromPromise(
	async ({
		input,
	}: {
		input: {
			context: WebsocketMachineContext;
			send: WebsocketStateMachineSend;
		};
	}) => {
		console.log("Subscribing to batch table WebSocket updates…", {
			isAuthenticated: input.context.isAuthenticated,
			batchTableId: input.context.batchTableId,
		});

		if (!input.context.isAuthenticated) {
			input.send({ type: "go-to=authenticating" });

			return;
		}

		if (!isValidNumber(input.context.batchTableId)) {
			// Let's try again later.

			await sleep(1_000);

			input.send({ type: "go-to=subscribing-to-batch-table" });

			return;
		}

		const subscribeProjectMessagePayload: WebSocketSubscribeBatchTableInputsPayload &
			ExtraDataForEachMessage = {
			message_payload: { batch_table_id: input.context.batchTableId },
			message_type: WebsocketAction.SubscribeBatchTableInputs,
			request_id: createRequestId(),
		};

		sendWebSocketMessage(input.context, subscribeProjectMessagePayload);
	},
);

export const websocketStateMachine = setup({
	types: {
		context: {} as WebsocketMachineContext,
		events: {} as WebsocketMachineEvents,
	},
	actors: {
		subscribeToBatchTableActor,
		subscribeToNotebookActor,
		authenticateActor,
	},
}).createMachine({
	context: {
		isSubscribedToBotConversation: false,
		isSubscribedToBatchTable: false,
		fileIdsSubscribedTo: new Set(),
		isSubscribedToNotebook: false,
		botConversationId: null,
		isAuthenticated: false,
		batchTableId: null,
		uuid: createUUID(),
		notebookId: null,
		websocket: null,
	},

	id: "websocket",
	initial: "idle",

	on: {
		// '*' matches any event type that wasn't handled by a deeper state node
		// 		"*": {
		// // Instead of a target, define an action that throws an error
		// 			actions: [
		// 				({ event, self }) => {
		// 					// You can access the current event and state (via self.getSnapshot().value)
		// 					const currentStateValue = self.getSnapshot().value;
		//
		// 					console.error(
		// 						`Invalid Transition: Event "${event.type}" is not accepted in state: "${currentStateValue}".`,
		// 						{event,currentStateValue}
		// 					);
		// 				},
		// 			],
		// 		},
		//
		"subscribe-to-batch-table": {
			actions: [
				({ context, self, event }) => {
					const previousBatchTableId = context.batchTableId;

					console.log("Asked to subscribe to batch table", {
						batchTableId: event.batchTableId,
						previousBatchTableId,
						context,
					});

					if (
						context.isSubscribedToBatchTable &&
						isValidNumber(previousBatchTableId)
					) {
						const unsubscribeProjectMessagePayload: WebSocketUnsubscribeBatchTableInputsPayload &
							ExtraDataForEachMessage = {
							message_type: WebsocketAction.UnsubscribeBatchTableInputs,
							message_payload: { batch_table_id: previousBatchTableId },
							request_id: createRequestId(),
						};

						sendWebSocketMessage(context, unsubscribeProjectMessagePayload);
					}

					self.send({ type: "go-to=subscribing-to-batch-table" });
				},
				assign({
					batchTableId: ({ event }) => event.batchTableId,
					isSubscribedToBatchTable: false,
				}),
			],
		},

		"subscribe-to-notebook-and-bot-conversation": {
			actions: [
				({ context, self, event }) => {
					const previousBotConversationId = context.botConversationId;
					const previousNotebookId = context.notebookId;

					console.log("Asked to subscribe to notebook and bot conversation", {
						botConversationId: event.botConversationId,
						previousBotConversationId,

						notebookId: event.notebookId,
						previousNotebookId,

						context,
					});

					if (
						context.isSubscribedToNotebook &&
						isValidNumber(previousNotebookId)
					) {
						const unsubscribeProjectMessagePayload: WebSocketUnsubscribeProjectPayload &
							ExtraDataForEachMessage = {
							message_type: WebsocketAction.UnsubscribeProject,
							message_payload: { project_id: previousNotebookId },
							request_id: createRequestId(),
						};

						sendWebSocketMessage(context, unsubscribeProjectMessagePayload);
					}

					if (
						context.isSubscribedToBotConversation &&
						isValidNumber(previousBotConversationId)
					) {
						const unsubscribeBotConversationMessagePayload: WebSocketUnsubscribeConversationPayload &
							ExtraDataForEachMessage = {
							message_payload: {
								bot_conversation_id: previousBotConversationId,
							},
							message_type: WebsocketAction.UnsubscribeBotConversation,
							request_id: createRequestId(),
						};

						sendWebSocketMessage(
							context,
							unsubscribeBotConversationMessagePayload,
						);
					}

					self.send({
						type: "go-to=subscribing-to-notebook-and-bot-conversation",
					});
				},
				assign({
					botConversationId: ({ event }) => event.botConversationId,
					notebookId: ({ event }) => event.notebookId,
					isSubscribedToBotConversation: false,
					isSubscribedToNotebook: false,
				}),
			],
		},
		"set=websocket": {
			actions: assign({
				websocket: ({ event }) => event.websocket,
			}),
			description: "Setting WebSocket",
			target: ".authenticating",
		},
	},

	states: {
		idle: {
			on: {
				"go-to=authenticating": {
					target: "authenticating",
				},
				"go-to=closed": {
					target: "closed",
				},
				"go-to=subscribing-to-batch-table": {
					target: "subscribing-to-batch-table",
				},
				"go-to=subscribing-to-notebook-and-bot-conversation": {
					target: "subscribing-to-notebook-and-bot-conversation",
				},
			},
		},

		authenticating: {
			exit: [
				log("Authenticated WebSocket."),
				assign({ isAuthenticated: true }),
			],
			description: "Authenticating WebSocket…",
			invoke: {
				input: ({ context, self }) => ({
					send: self.send,
					context,
				}),
				src: "authenticateActor",
			},
			on: {
				"go-to=authenticating": {
					target: "authenticating",
					reenter: true,
				},
				"go-to=idle": {
					target: "idle",
				},
				"go-to=closed": {
					target: "closed",
				},
				"go-to=subscribing-to-batch-table": {
					target: "subscribing-to-batch-table",
				},
				"go-to=subscribing-to-notebook-and-bot-conversation": {
					target: "subscribing-to-notebook-and-bot-conversation",
				},
			},
		},

		"subscribing-to-notebook-and-bot-conversation": {
			description: "Subscribing to notebook WebSocket updates",
			invoke: {
				input: ({ context, self }) => ({ context: context, send: self.send }),
				src: "subscribeToNotebookActor",
			},
			on: {
				"go-to=subscribing-to-notebook-and-bot-conversation": {
					target: "subscribing-to-notebook-and-bot-conversation",
					reenter: true,
				},
				"go-to=closed": {
					target: "closed",
				},
				"go-to=idle": {
					target: "idle",
				},
				"set=subscribed-to-bot-conversation": {
					actions: [
						assign(({ context, event }) => {
							if (context.botConversationId === event.botConversationId) {
								return {
									isSubscribedToBotConversation: true,
								};
							}

							return context;
						}),
						({ context, self }) => {
							if (context.isSubscribedToNotebook) {
								self.send({ type: "go-to=idle" });
							}
						},
					],
				},
				"set=subscribed-to-notebook": {
					actions: [
						assign(({ context, event }) => {
							if (context.notebookId === event.notebookId) {
								return {
									isSubscribedToNotebook: true,
								};
							}

							return context;
						}),
						({ context, self }) => {
							if (context.isSubscribedToBotConversation) {
								self.send({ type: "go-to=idle" });
							}
						},
					],
				},
			},
		},

		"subscribing-to-batch-table": {
			description: "Subscribing to batch table WebSocket updates",
			entry: () => {
				console.log("Subscribing to batch table WebSocket updates…");
			},
			invoke: {
				input: ({ context, self }) => ({ context: context, send: self.send }),
				src: "subscribeToBatchTableActor",
			},
			on: {
				"go-to=subscribing-to-batch-table": {
					target: "subscribing-to-batch-table",
					reenter: true,
				},
				"go-to=closed": {
					target: "closed",
				},
				"go-to=idle": {
					target: "idle",
				},
				"go-to=subscribing-to-notebook-and-bot-conversation": {
					target: "subscribing-to-notebook-and-bot-conversation",
				},
				"set=subscribed-to-batch-table": {
					actions: [
						assign(({ context, event }) => {
							if (context.batchTableId === event.batchTableId) {
								return {
									isSubscribedToBatchTable: true,
								};
							}

							return context;
						}),
						({ context, self }) => {
							if (context.isSubscribedToBatchTable) {
								self.send({ type: "go-to=idle" });
							}
						},
					],
				},
			},
		},

		closed: {
			entry: assign({
				isSubscribedToBotConversation: false,
				isSubscribedToNotebook: false,
				isAuthenticated: false,
			}),
		},
	},
});
