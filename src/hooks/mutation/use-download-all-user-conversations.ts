import { useMutation } from "@tanstack/react-query";
import { invariant } from "es-toolkit";

import { clientAPI_V1 } from "#/api";
import {
	GET_AWS_FILE_AS_STRING_BINARY_ACTION,
	isValidNumber,
} from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { OrganizationId } from "#/types/general";
import type { BetterbrainUserId } from "#/types/notebook";
import type { AwsBucket, AwsKey } from "../fetch/use-fetch-all-organizations";

type DownloadAllConversationsRequest = {
	userId: BetterbrainUserId | undefined;
	organizationId: OrganizationId;
	return_feedback_only: boolean;
};

export type DownloadAllConversationsAwsResponse = {
	aws_bucket: AwsBucket;
	aws_key: AwsKey;
};

export type DownloadAllConversationsResponse = null;

const mutationKey = queryKeyFactory.get["all-conversations"].queryKey;

export function useDownloadAllUserConversations() {
	return useMutation<
		DownloadAllConversationsResponse,
		Error,
		DownloadAllConversationsRequest
	>({
		mutationKey,

		mutationFn: async (args) => {
			const searchParams = new URLSearchParams();

			if (isValidNumber(args.userId)) {
				searchParams.set("user_id", args.userId.toString());
			}
			if (args.return_feedback_only) {
				searchParams.set("return_feedback_only", "true");
			}

			const path = `/organizations/${args.organizationId}/chat/usage/messages?${searchParams.toString()}`;

			const responseAws =
				await clientAPI_V1.get<DownloadAllConversationsAwsResponse>(path);

			const formData = new FormData();
			formData.set("formId", GET_AWS_FILE_AS_STRING_BINARY_ACTION);
			formData.set("aws_bucket", responseAws.data.aws_bucket);
			formData.set("aws_key", responseAws.data.aws_key);
			formData.set("fileMimeType", "text/csv");

			const res = await fetch("/actions", {
				body: formData,
				method: "POST",
			});

			const csvBase64String = await res.text();

			invariant(csvBase64String, "No fileAsBase64String!");

			const blob = await fetch(csvBase64String).then((res) => res.blob());

			const fileUrl = URL.createObjectURL(blob);

			const a = document.createElement("a");
			a.download = `all-conversations__org-id=${args.organizationId}${isValidNumber(args.userId) ? `__user-id=${args.userId}` : ""}${args.return_feedback_only ? "__with-feedback-only" : ""}.csv`;
			a.href = fileUrl;

			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);

			URL.revokeObjectURL(fileUrl);

			return null;
		},

		meta: {
			errorTitle: "Error downloading all conversations!",
		},
	});
}
