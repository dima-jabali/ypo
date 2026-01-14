import { isPlainObject } from "es-toolkit";
import { memo, useEffect, useRef, useState } from "react";
import { titleCase } from "scule";

import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import { isValidNumber } from "#/helpers/utils";
import { useShouldShowSources } from "#/hooks/use-should-show-sources";
import {
	type BotConversationMessage,
	BotConversationMessageStatus,
} from "#/types/chat";
import { closeDetails } from "./common";
import { ReasoningPopover } from "./InfoPopover";
import { ANIMATED_DOTS, CHEVRON_RIGHT, DOUBLE_CHECK } from "./icons";
import { MessageWrapper } from "./MessageWrapper";
import { getMatchingReasoningText } from "./messageHelpers";

type Props = {
	msg: BotConversationMessage;
};

const makeExtraInfoListItem = (
	key: string,
	value: unknown,
): React.ReactNode => {
	if (!value) return null;

	switch (typeof value) {
		case "boolean":
		case "string":
		case "number": {
			if (value === "") return null;

			return (
				<p key={`${key}${value}`}>
					<span className="font-bold">{titleCase(key)}</span> {`${value}`}
				</p>
			);
		}

		case "object": {
			if (!value) return null;

			if (Array.isArray(value)) {
				return (
					<div className="pl-4 flex flex-col gap-1">
						{value.map((v) => (
							<p key={`${key}${v}`}>• {`${v}`}</p>
						))}
					</div>
				);
			} else {
				return (
					<div className="pl-4 flex flex-col gap-1">
						{Object.entries(value).map(([k, v]) => makeExtraInfoListItem(k, v))}
					</div>
				);
			}
		}

		default:
			console.log("Unhandled type", { key, value });
			return null;
	}
};

const getJsonInfoOfToolSelectionResponseJson = (
	message: BotConversationMessage,
) => {
	if (!message.json) return "";

	if (isPlainObject(message.json)) {
		const jsonJsxs = Object.entries(message.json).map(([key, value]) => {
			const hasAnswer =
				Reflect.get(value, "does_context_contain_answer") === true;
			const isLink = key.startsWith("http");

			const answer = Reflect.get(value, "answer");
			const answerJsx = (() => {
				if (!answer) return null;

				if (typeof answer === "string") {
					return <span className="word-break">{answer}</span>;
				}

				return makeExtraInfoListItem("answer", answer);
			})();

			return (
				<div key={key}>
					{isLink ? (
						<a
							className="link hover:underline block break-all"
							target="_blank"
							href={key}
						>
							• {key}
						</a>
					) : (
						<span className="font-bold break-all">• {key}:</span>
					)}

					<div className="ml-4">
						{hasAnswer ? (
							<fieldset className="">
								<span className="font-bold">Answer:&nbsp;</span>

								{answerJsx}
							</fieldset>
						) : (
							<span className="text-xs italic">
								No answer from this source.
							</span>
						)}
					</div>
				</div>
			);
		});

		return <div className="flex flex-col gap-4">{jsonJsxs}</div>;
	}

	return "";
};

export const GeneralIntermediateMessage = memo(
	function GeneralIntermediateMessage({ msg }: Props) {
		const isMessageComplete =
			msg.message_status === BotConversationMessageStatus.Complete;
		const reasoning =
			msg.json &&
			"reasoning" in msg.json &&
			typeof msg.json.reasoning === "string"
				? msg.json.reasoning
				: "";

		const detailsInitialProps = useState(
			isMessageComplete ? undefined : { open: true },
		)[0];

		const detailsRef = useRef<HTMLDetailsElement>(null);

		const shouldShowSources = useShouldShowSources(
			msg.parallel_conversation_id,
		);

		useEffect(() => {
			if (isMessageComplete && detailsRef.current?.open) {
				closeDetails(detailsRef.current);
			}
		}, [isMessageComplete]);

		const isParallelMessage = isValidNumber(msg.parallel_conversation_id);
		const extraInfo = getJsonInfoOfToolSelectionResponseJson(msg);

		return (
			<MessageWrapper
				title="Intermediate Message General Handler"
				className="text-muted-foreground text-xs"
				data-intermediate-message-general-handler
				data-id={msg.id}
			>
				<details
					className="w-full group"
					{...detailsInitialProps}
					ref={detailsRef}
				>
					<summary className="z-10 @[450px]:ml-[25%] w-fit flex px-0 select-none cursor-pointer data-[is-parallel-msg=true]:bg-parallel-msg">
						<div
							className="z-10 bg-notebook px-3.5 w-fit text-nowrap flex items-center gap-1 data-[is-parallel-msg=true]:bg-parallel-msg"
							data-is-parallel-msg={isParallelMessage}
						>
							<span className="group-open:rotate-90">{CHEVRON_RIGHT}</span>

							<i>{msg.toggle_text || getMatchingReasoningText(msg)}</i>

							{isMessageComplete ? DOUBLE_CHECK : ANIMATED_DOTS}

							{reasoning ? (
								<ReasoningPopover
									defaultOpen={!isMessageComplete}
									key={`${isMessageComplete}`}
									reasoning={reasoning}
								/>
							) : null}
						</div>
					</summary>

					<div className="relative -top-3 z-0 h-fit w-full rounded-xl border-2 border-border-smooth p-4 flex flex-col gap-3">
						{extraInfo}
					</div>
				</details>

				<SourcesForUser sources={msg.sources} shouldShow={shouldShowSources} />
			</MessageWrapper>
		);
	},
);

GeneralIntermediateMessage.whyDidYouRender = true;
