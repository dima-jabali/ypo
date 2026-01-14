import { Bot } from "lucide-react";

import {
	BotConversationMessageType,
	type BotConversationMessage,
	type BotJsonMessage,
	type ToolResponseJson,
	type ToolSelectionResponseJson,
} from "#/types/chat";

export const BOT_IMG = (
	<div className="size-8 rounded-full bg-indigo-800 p-1.5">
		<Bot className="size-5 text-white" />
	</div>
);

export const hasInputsInJson = (
	json: BotJsonMessage,
): json is ToolSelectionResponseJson => {
	return (
		json !== null &&
		json !== undefined &&
		"tool" in json &&
		json.tool !== undefined &&
		json.tool !== null &&
		"inputs" in json.tool &&
		json.tool.inputs !== undefined &&
		json.tool.inputs !== null
	);
};

export const hasOutputsInJson = (
	json: BotJsonMessage,
): json is ToolResponseJson => {
	return (
		json !== null &&
		json !== undefined &&
		"tool" in json &&
		json.tool !== undefined &&
		json.tool !== null &&
		"outputs" in json.tool &&
		json.tool.outputs !== undefined &&
		json.tool.outputs !== null
	);
};

export const hasAnswersInJson = (
	json: BotJsonMessage,
): json is ToolResponseJson => {
	return (
		json !== null &&
		json !== undefined &&
		"tool" in json &&
		json.tool !== undefined &&
		json.tool !== null &&
		"outputs" in json.tool &&
		json.tool.outputs !== undefined &&
		json.tool.outputs !== null
	);
};

export const getToolType = (msg: BotConversationMessage) => {
	return (
		"json" in msg &&
		msg.json &&
		"tool" in msg.json &&
		"name" in msg.json.tool &&
		msg.json.tool?.name
	);
};

export const getMatchingReasoningText = (message: BotConversationMessage) => {
	switch (message.message_type) {
		case BotConversationMessageType.Reflection_Message:
			return "Reflecting";

		case BotConversationMessageType.Plan_Next_Step_Response:
			return "Planning next step";

		case BotConversationMessageType.Reflection_Selection_Facilitator_Message:
		case BotConversationMessageType.Tool_Selection_Response:
			return "Selected tool";

		case BotConversationMessageType.Tool_Response:
			return "Tool response";

		default:
			return message.message_type;
	}
};
