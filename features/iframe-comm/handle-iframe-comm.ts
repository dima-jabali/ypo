import { useEffect, useState } from "react";

import { validateTokenToSetItOnApiHeader } from "#/api";
import { authStore } from "#/contexts/auth/auth";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { getIsRunningInIframe, isValidNumber, noop } from "#/helpers/utils";
import { IframeCommType, validateIframeMessage } from "./helpers";
import type { OrganizationId } from "#/types/general";

export function HandleIframeCommunication() {
	const [parentOrigin, setParentOrigin] = useState("");

	const token = authStore.use.token();

	useEffect(() => {
		if (!getIsRunningInIframe()) {
			console.log(
				"Not running inside an iframe, skipping iframe communication",
			);

			return;
		}

		function askForIframeData() {
			console.log("askForIframeData");

			window.parent.postMessage(
				{
					value: "Iframe communication requested",
					type: IframeCommType.RequestData,
				},
				parentOrigin || "*",
			);
		}

		if (!token || !parentOrigin) {
			askForIframeData();
		}

		function handleMessageReceived(event: MessageEvent<unknown>) {
			console.log("HandleIframeCommunication handleMessageReceived", {
				event,
				data: event.data,
				parentOrigin,
				eventOrigin: event.origin,
			});

			try {
				const validatedData = validateIframeMessage.safeParse(event.data);

				if (validatedData.data) {
					switch (validatedData.data.type) {
						case IframeCommType.OrganizationId: {
							const newOrgId = Number(validatedData.data.value);

							if (isValidNumber(newOrgId)) {
								generalContextStore.setState((prev) => {
									if (prev.organizationId === newOrgId) {
										return prev;
									}

									return {
										organizationId: newOrgId as OrganizationId,
										botConversationId: null,
										batchTableId: null,
										notebookId: null,
									};
								});
							}

							break;
						}

						case IframeCommType.ParentOrigin: {
							const origin = validatedData.data.value;

							setParentOrigin(origin);

							break;
						}

						case IframeCommType.Token: {
							const token = validatedData.data.value;

							if (!token) {
								authStore.setState({
									isUsingLocalClerk: false,
									token: "",
								});
							}

							const prevToken = authStore.getState().token;
							const areTheSame = token === prevToken;
							if (areTheSame) {
								break;
							}

							console.log("Validating token...", token);

							validateTokenToSetItOnApiHeader(token)
								.then((validatedToken) => {
									console.log("Token validated!", validatedToken);

									authStore.setState({
										token: validatedToken.token.token,
										isUsingLocalClerk: false,
									});
								})
								.catch(noop);

							break;
						}

						case IframeCommType.ClerkApiToken: {
							const clerkApiToken = validatedData.data.value;

							authStore.setState({
								clerkApiToken: clerkApiToken,
								isUsingLocalClerk: false,
							});

							break;
						}

						default: {
							throw new Error(
								`Invalid message type in iframe communication: "${validatedData.data.type}"`,
							);
						}
					}
				}
			} catch (error) {
				console.error(error);
			}
		}

		const unsubscribe = generalContextStore.subscribe(
			(s) => s.organizationId,
			(orgId) => {
				window.parent.postMessage(
					{
						type: "org-id-changed",
						value: `${orgId}`,
					},
					parentOrigin || "*",
				);
			},
		);

		window.addEventListener("message", handleMessageReceived);

		return () => {
			window.removeEventListener("message", handleMessageReceived);

			unsubscribe();
		};
	}, [parentOrigin, token]);

	return null;
}
