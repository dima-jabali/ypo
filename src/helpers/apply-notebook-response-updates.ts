import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { createISODate, isDev, isRecord, isValidNumber } from "#/helpers/utils";
import type {
	BotConversationId,
	ISODateString,
	NotebookId,
	OrganizationId,
} from "#/types/general";
import {
	NotebookActionType,
	type Notebook,
	type PatchNotebookAction,
} from "#/types/notebook";
import {
	ResponseProjectActionType,
	type PatchProjectResponseAction,
} from "#/types/post-block-update-types";

function sortByCreatedAt(
	a: { created_at: ISODateString },
	b: { created_at: ISODateString },
) {
	return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

export function applyNotebookRequestUpdates({
	organizationId,
	request,
}: {
	organizationId: OrganizationId;
	request: {
		bot_conversation_id: BotConversationId;
		updates: Array<PatchNotebookAction>;
		timestamp: ISODateString;
		project_id: NotebookId;
	};
}) {
	if (request.updates.length === 0) return;

	const generalContextState = generalContextStore.getState();
	const {
		getBotConversationMessageListPages,
		getNotebookListPages,
		setNotebookListPages,
		setNotebook,
		getNotebook,
	} = generalContextState;
	const botConversationMessageListPages = getBotConversationMessageListPages(
		request.bot_conversation_id,
	);
	const notebook = getNotebook(request.project_id);

	if (!notebook || !botConversationMessageListPages) {
		console.log("No notebook/botConversationMessageListPages to update!", {
			botConversationMessageListPages,
			notebook,
			request,
		});

		return;
	}

	const patchedNotebook: Notebook = {
		...notebook,
		blocks: [...notebook.blocks],
	};

	request.updates.forEach((action) => {
		switch (action.action_type) {
			case NotebookActionType.CreateBlock: {
				const { block } = action.action_info;
				const blockUuid = block.uuid;

				const alreadyExistingBlockIndex = patchedNotebook.blocks.findIndex(
					({ uuid }) => uuid === blockUuid,
				);

				if (alreadyExistingBlockIndex === -1) {
					const blockAboveUuid = block.block_above_uuid;
					const blockAboveIndex = patchedNotebook.blocks.findIndex(
						({ uuid }) => uuid === blockAboveUuid,
					);

					if (blockAboveIndex === -1) {
						if (patchedNotebook.blocks.length === 0) {
							patchedNotebook.blocks.push(block);
						} else {
							console.error(
								"Block above uuid not found and the notebook is not empty!",
								{
									action,
									patchedNotebook,
								},
							);

							throw new Error(
								"Block above uuid not found and the notebook is not empty!",
							);
						}
					} else {
						patchedNotebook.blocks.splice(blockAboveIndex + 1, 0, block);

						const blockBelow = patchedNotebook.blocks[blockAboveIndex + 2];
						if (blockBelow) {
							blockBelow.block_above_uuid = blockUuid;
						}
					}
				} else {
					patchedNotebook.blocks[alreadyExistingBlockIndex] = block;
				}

				break;
			}

			case NotebookActionType.DeleteBlock: {
				const blockUuid = action.action_info.block_uuid;
				const blockIndex = patchedNotebook.blocks.findIndex(
					({ uuid }) => uuid === blockUuid,
				);

				if (blockIndex === -1) {
					console.log(
						"[request-update] Block not found! Not deleting it.",
						blockUuid,
					);

					break;
				}

				const previousBlock = patchedNotebook.blocks[blockIndex - 1];
				const nextBlock = patchedNotebook.blocks[blockIndex + 1];
				if (nextBlock) {
					nextBlock.block_above_uuid = previousBlock?.uuid ?? null;
				}

				patchedNotebook.blocks.splice(blockIndex, 1);

				break;
			}

			case NotebookActionType.UpdateBlock: {
				const blockUuid = action.action_info.block_uuid;
				const blockIndex = patchedNotebook.blocks.findIndex(
					({ uuid }) => uuid === blockUuid,
				);
				const block = patchedNotebook.blocks[blockIndex];

				if (!block) break;

				const { value, key } = action.action_info;

				const patchedBlock: typeof block = { ...block };

				mutateNestedValue(patchedBlock, [key], {
					appendNestedString: false,
					value,
				});

				patchedNotebook.blocks[blockIndex] = patchedBlock;

				if (isDev) {
					console.log({ patchedBlock, block, action });
				}

				break;
			}

			case NotebookActionType.UpdateProject: {
				const actionNotebookUuid = action.action_info.project_uuid;

				if (patchedNotebook.metadata.uuid !== actionNotebookUuid) {
					return;
				}

				const { key, value } = action.action_info;
				const actualKey = key[0];

				if (actualKey) {
					const notebookListPages = getNotebookListPages(organizationId);

					if (notebookListPages) {
						const patchedNotebookListPages: typeof notebookListPages = {
							...notebookListPages,
							pages: notebookListPages.pages.map((page) => ({
								...page,
								results: page.results.map((notebook) => {
									if (notebook.uuid === actionNotebookUuid) {
										return {
											...notebook,
											[actualKey]: value,
										};
									}

									return notebook;
								}),
							})),
						};

						setNotebookListPages(organizationId, patchedNotebookListPages);
					}

					Reflect.set(patchedNotebook.metadata, actualKey, value);
				} else {
					console.log("No idea what to do with this key!", { key, value });
				}

				break;
			}

			default: {
				console.log("Unknown action type!", { action });
				break;
			}
		}
	});

	setNotebook(request.project_id, patchedNotebook);

	// if (isDev) {
	// 	console.log({
	// 		applyNotebookUpdates: performance.now() - start,
	// 		sortPages: endSortPages - sortPages,
	// 	});
	// }
}

function mutateNestedValue(
	object: unknown,
	keys: Array<string>,
	params: { value: unknown; appendNestedString?: boolean | null | undefined },
) {
	if (keys.length === 0) return;

	let currentObj = object;

	if (!isRecord(currentObj)) return;

	try {
		keys.slice(0, -1).forEach((key) => {
			if (!isRecord(currentObj)) return;

			if (!Object.hasOwn(currentObj, key)) {
				Reflect.set(currentObj, key, {});
			}

			currentObj = Reflect.get(currentObj, key);
		});

		if (!isRecord(currentObj)) return;

		const lastKey = keys.at(-1);

		if (!lastKey) return;

		if (params.appendNestedString) {
			if (typeof currentObj[lastKey] !== "string") {
				throw new Error(
					`Tried to append string but target value isn't a string`,
				);
			}

			currentObj[lastKey] += params.value;
		} else {
			currentObj[lastKey] = params.value;
		}
	} catch (error) {
		console.error("Error mutating nested value!", {
			error,
			object,
			keys,
			params,
		});
	}
}

export function applyNotebookResponseUpdates({
	organizationId,
	response,
}: {
	organizationId: OrganizationId;
	response: {
		updates: Array<PatchProjectResponseAction>;
		bot_conversation_id: BotConversationId;
		timestamp: ISODateString;
		project_id: NotebookId;
	};
}) {
	if (response.updates.length === 0) return;

	const generalContextState = generalContextStore.getState();
	const {
		getBotConversationMessageListPages,
		setBotConversationMessageListPages,
		getNotebookListPages,
		setNotebookListPages,
		getBotConversation,
		setBotConversation,
		getBotPlan,
		setBotPlan,
		setNotebook,
		getNotebook,
	} = generalContextState;
	const botConversationMessageListPages = getBotConversationMessageListPages(
		response.bot_conversation_id,
	);
	const notebook = getNotebook(response.project_id);

	if (!notebook || !botConversationMessageListPages) {
		console.log("No notebook/botConversationMessageListPages to update!", {
			botConversationMessageListPages,
			notebook,
			response,
		});

		return;
	}

	const patchedBotConversationMessageListPage: typeof botConversationMessageListPages =
		{
			...botConversationMessageListPages,
			pages: botConversationMessageListPages.pages.map((page) => ({
				...page,
				results: [...page.results],
			})),
		};
	const patchedNotebook: Notebook = {
		...notebook,
		blocks: [...notebook.blocks],
	};

	response.updates.forEach((action) => {
		switch (action.action_type) {
			case ResponseProjectActionType.CreateBlock: {
				const { block } = action.action_payload;
				const blockUuid = block.uuid;

				const alreadyExistingBlockIndex = patchedNotebook.blocks.findIndex(
					({ uuid }) => uuid === blockUuid,
				);

				if (alreadyExistingBlockIndex === -1) {
					patchedNotebook.blocks.push(block);
				} else {
					patchedNotebook.blocks[alreadyExistingBlockIndex] = block;
				}

				break;
			}

			case ResponseProjectActionType.CreateBotConversationMessage: {
				{
					const updateBotConversationId =
						action.action_payload.bot_conversation_message.bot_conversation.id;

					if (
						updateBotConversationId !==
						patchedNotebook.metadata.bot_conversation?.id
					) {
						console.warn("Bot conversation id mismatch!", {
							patchedNotebook,
							action,
						});

						break;
					}
				}

				const { bot_conversation_message: msg } = action.action_payload;
				const { uuid } = msg;

				const lastPage = patchedBotConversationMessageListPage.pages.at(-1);

				const alreadyExistingIndex = lastPage?.results.findIndex(
					(conv) => conv.uuid === uuid,
				);

				if (
					isValidNumber(alreadyExistingIndex) &&
					alreadyExistingIndex !== -1 &&
					lastPage
				) {
					lastPage.results[alreadyExistingIndex] = msg;

					break;
				}

				if (lastPage) {
					lastPage.results.push(msg);
					lastPage.num_results += 1;
				} else {
					patchedBotConversationMessageListPage.pages.push({
						results: [msg],
						num_results: 1,
						limit: 100,
						offset: 0,
					});
				}

				break;
			}

			case ResponseProjectActionType.DeleteBlock: {
				const blockUuid = action.action_payload.block_uuid;
				const blockIndex = patchedNotebook.blocks.findIndex(
					({ uuid }) => uuid === blockUuid,
				);

				if (blockIndex === -1) {
					console.log("Block not found! Not deleting it.");

					break;
				}

				patchedNotebook.blocks.splice(blockIndex, 1);

				break;
			}

			case ResponseProjectActionType.DeleteBotConversationMessage: {
				const msgUuid = action.action_payload.message_uuid;

				patchedBotConversationMessageListPage.pages.forEach((page) => {
					page.results = page.results.filter(({ uuid }) => uuid !== msgUuid);
				});

				break;
			}

			case ResponseProjectActionType.UpdateBlock: {
				const blockUuid = action.action_payload.block_uuid;
				const blockIndex = patchedNotebook.blocks.findIndex(
					({ uuid }) => uuid === blockUuid,
				);
				const block = patchedNotebook.blocks[blockIndex];

				if (!block) break;

				const { is_incremental_string_change, value, key } =
					action.action_payload;

				const patchedBlock: typeof block = {
					...block,
					last_modified_at: createISODate(),
				};

				mutateNestedValue(patchedBlock, key, {
					appendNestedString: is_incremental_string_change,
					value,
				});

				patchedNotebook.blocks[blockIndex] = patchedBlock;

				if (isDev) {
					console.log({ patchedBlock, block, action });
				}

				break;
			}

			case ResponseProjectActionType.UpdateProject: {
				const actionNotebookUuid = action.action_payload.project_uuid;

				if (patchedNotebook.metadata.uuid !== actionNotebookUuid) {
					return;
				}

				const { key, value } = action.action_payload;
				const actualKey = key[0];

				if (actualKey) {
					const notebookListPages = getNotebookListPages(organizationId);

					if (notebookListPages) {
						const patchedNotebookListPages: typeof notebookListPages = {
							...notebookListPages,
							pages: notebookListPages.pages.map((page) => ({
								...page,
								results: page.results.map((notebook) => {
									if (notebook.uuid === actionNotebookUuid) {
										return {
											...notebook,
											[actualKey]: value,
										};
									}

									return notebook;
								}),
							})),
						};

						setNotebookListPages(organizationId, patchedNotebookListPages);
					}

					Reflect.set(patchedNotebook.metadata, actualKey, value);
				} else {
					console.log("No idea what to do with this key!", { key, value });
				}

				break;
			}

			case ResponseProjectActionType.UpdateBotConversationMessage: {
				const msgUuid = action.action_payload.message_uuid;
				const arr = patchedBotConversationMessageListPage.pages.at(-1)?.results;

				if (!arr) {
					console.error("No last page!", {
						patchedBotConversationMessageListPage,
						action,
					});

					break;
				}

				const patchedMessageIndex = arr.findIndex(
					({ uuid }) => uuid === msgUuid,
				);
				const patchedMessage =
					patchedMessageIndex === -1 ? null : { ...arr[patchedMessageIndex]! };

				if (!patchedMessage) {
					console.error("Message not found at last page!", {
						action,
						patchedBotConversationMessageListPage,
					});

					break;
				}

				const { is_incremental_string_change, value, key } =
					action.action_payload;

				mutateNestedValue(patchedMessage, key, {
					appendNestedString: is_incremental_string_change,
					value,
				});

				arr[patchedMessageIndex] = patchedMessage;

				break;
			}

			case ResponseProjectActionType.UpdateBotConversation: {
				const botConversation = getBotConversation(
					response.bot_conversation_id,
				);

				if (
					!botConversation ||
					botConversation.id !== action.action_payload.id
				) {
					break;
				}

				const patchedBotConversation: typeof botConversation = {
					...botConversation,
				};

				const { value, key } = action.action_payload;

				mutateNestedValue(patchedBotConversation, key, {
					appendNestedString: false,
					value,
				});

				setBotConversation(
					response.bot_conversation_id,
					patchedBotConversation,
				);

				break;
			}

			case ResponseProjectActionType.CreatePlan: {
				setBotPlan(
					response.bot_conversation_id,
					organizationId,
					response.project_id,
					action.action_payload.plan,
				);

				break;
			}

			case ResponseProjectActionType.CreatePlanStep: {
				const plan = getBotPlan(
					response.bot_conversation_id,
					organizationId,
					response.project_id,
				);

				if (!plan) {
					console.log("No current plan to add step to!", {
						action,
					});

					break;
				}

				const patchedPlan: typeof plan = {
					...plan,
					sub_tasks: [...(plan.sub_tasks || [])],
				};

				if (!patchedPlan.sub_tasks) {
					patchedPlan.sub_tasks = [];
				}

				const planStepId = action.action_payload.plan_step.id;
				const planStepIndex = patchedPlan.sub_tasks.findIndex(
					({ id }) => id === planStepId,
				);

				console.log({ planStepIndex, action });

				if (planStepIndex === -1) {
					// Check if it has a `parent_step.id`. If it does,
					// we must nest it under the parent's sub_tasks array.
					const parentStepId = action.action_payload.plan_step.parent_step.id;

					if (isValidNumber(parentStepId)) {
						// Find the parent and add to its sub_tasks array:
						const parent = patchedPlan.sub_tasks.find(
							({ id }) => id === parentStepId,
						);

						if (parent) {
							if (!parent.sub_tasks) {
								parent.sub_tasks = [];
							}

							parent.sub_tasks.push(action.action_payload.plan_step);
						} else {
							console.error("Parent step not found!", {
								action,
								plan,
							});
						}
					} else {
						patchedPlan.sub_tasks.push(action.action_payload.plan_step);
					}
				} else {
					// Already exists, let's just replace it:
					patchedPlan.sub_tasks[planStepIndex] =
						action.action_payload.plan_step;
				}

				setBotPlan(
					response.bot_conversation_id,
					organizationId,
					response.project_id,
					patchedPlan,
				);

				break;
			}

			case ResponseProjectActionType.UpdatePlanStep:
			case ResponseProjectActionType.UpdatePlan: {
				const plan = getBotPlan(
					response.bot_conversation_id,
					organizationId,
					response.project_id,
				);

				if (!plan) {
					console.log("No current plan to update!", {
						action,
					});

					break;
				}

				if (!Array.isArray(plan.sub_tasks)) {
					console.log("No plan sub tasks to update!", {
						action,
						plan,
					});

					return;
				}

				const patchedPlan = structuredClone(plan);

				const { value, key, plan_step_id } = action.action_payload;

				const planStep = patchedPlan.sub_tasks!.find(
					({ id }) => id === plan_step_id,
				);

				if (!planStep) {
					console.log("No plan step found to update!", {
						action,
						plan,
					});

					return;
				}

				mutateNestedValue(planStep, key, {
					appendNestedString: false,
					value,
				});

				setBotPlan(
					response.bot_conversation_id,
					organizationId,
					response.project_id,
					patchedPlan,
				);

				break;
			}

			default: {
				console.warn("Unknown action type!", { action });
				break;
			}
		}
	});

	for (const page of patchedBotConversationMessageListPage.pages) {
		page.results.sort(sortByCreatedAt);
	}

	setBotConversationMessageListPages(
		response.bot_conversation_id,
		patchedBotConversationMessageListPage,
	);
	const newNotebook = setNotebook(response.project_id, patchedNotebook);

	if (isDev) {
		console.log({
			patchedNotebook,
			newNotebook,
		});
	}
}
