import { Plus } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import { DialogFooter } from "#/components/Dialog";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { getErrorMessage } from "#/helpers/utils";
import {
	useCreateBotSource,
	type CreateWebBotSourceRequest,
} from "#/hooks/mutation/use-create-bot-source";
import { useCreateWebsite } from "#/hooks/mutation/use-create-website";
import {
	useUpdateBotSource,
	type UpdateWebBotSourceByIdRequest,
} from "#/hooks/mutation/use-update-bot-source";
import { useForceRender } from "#/hooks/use-force-render";
import {
	BotSourceFormAction,
	GeneralStatus,
	type BotSource,
	type WebBotSource,
	type Website,
} from "#/types/bot-source";
import {
	BOT_NAME_INPUT_NAME,
	BOT_SOURCE_DESCRIPTION_INPUT_NAME,
	EDIT_OR_CREATE_BOT_SOURCE_FORM_ID,
	editOrCreateSuccessToast,
	IS_BOT_SOURCE_ARCHIVED_INPUT_NAME,
	noBotNameToast,
} from "../../helpers";
import { AddWebCrawlDialog } from "./AddWebCrawlDialog";
import { WebCrawlCard } from "./WebCrawlCard";
import { WebsiteCard } from "./WebsiteCard";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

type Props = {
	action: BotSourceFormAction;
	source: WebBotSource;
	setNextBotSources: React.Dispatch<React.SetStateAction<BotSource[]>>;
	closeDialog: () => void;
};

export const WebForm: React.FC<Props> = ({
	action,
	source,
	setNextBotSources,
	closeDialog,
}) => {
	const organizationId = generalContextStore.use.organizationId();

	const [selectedWebCrawls, setSelectedWebCrawls] = useState(
		source.web_crawls ?? [],
	);
	const [isLoading, setIsLoading] = useState(false);

	const websitesRef = useRef<Array<Website>>(source.websites ?? []);

	const createBotSource = useCreateBotSource();
	const updateBotSource = useUpdateBotSource();
	const createWebsite = useCreateWebsite();
	const forceRender = useForceRender();

	useLayoutEffect(() => {
		setSelectedWebCrawls(source.web_crawls ?? []);

		websitesRef.current = [...(source.websites ?? [])];

		forceRender();
	}, [forceRender, source.web_crawls, source.websites]);

	async function handleSendWebForm() {
		if (isLoading) return;

		const form = document.getElementById(
			EDIT_OR_CREATE_BOT_SOURCE_FORM_ID,
		) as HTMLFormElement | null;

		if (!form) return;

		const formData = new FormData(form);

		const rawIsBotSourceArchived = formData.get(
			IS_BOT_SOURCE_ARCHIVED_INPUT_NAME,
		);
		const rawDescription = formData.get(BOT_SOURCE_DESCRIPTION_INPUT_NAME);
		const rawBotName = formData.get(BOT_NAME_INPUT_NAME);

		if (!rawBotName) {
			console.error("Error getting form entries", {
				rawDescription,
				formData,
				source,
			});

			return;
		}

		// Casting to string because we know it's a string:
		const botName = (rawBotName as string).trim();

		if (!botName) {
			noBotNameToast();

			return;
		}

		// Casting to string because we know it's a string:
		const description = (rawDescription as string).trim();

		// Casting here because we know it's `"on" | undefined`:
		const isBotSourceArchived = rawIsBotSourceArchived === "on";

		try {
			setIsLoading(true);

			let newBotSource: BotSource | undefined;

			// First, create websites:
			const createOrEditWebsitesPromises = websitesRef.current
				.filter(
					(item) => !source.websites?.find((website) => website.id === item.id),
				)
				.filter((item) => item.website_url !== "")
				.map((website) =>
					createWebsite.mutateAsync({
						website_url: website.website_url,
						index_refresh: false,
						organizationId,
						index: true,
					}),
				);

			const createdOrEditedWebsites = await Promise.all(
				createOrEditWebsitesPromises,
			);

			if (action === BotSourceFormAction.Create) {
				const newBotSourceInfo: CreateWebBotSourceRequest = {
					web_crawls: selectedWebCrawls.map((w) => ({ id: w.id })),
					add_to_bot_ids: source.bots.map((b) => b.id),
					websites: createdOrEditedWebsites,
					source_type: source.source_type,
					organizationId,
					name: botName,
					description,
				};

				console.log({ newBotSourceInfo, selectedWebCrawls });

				newBotSource = await createBotSource.mutateAsync(newBotSourceInfo);
			} else {
				const updatedBotSourceInfo: UpdateWebBotSourceByIdRequest = {
					web_crawls: selectedWebCrawls.map((w) => ({ id: w.id })),
					sourceId: source.id,
					organizationId,
				};

				if (createdOrEditedWebsites.length > 0) {
					updatedBotSourceInfo.websites = createdOrEditedWebsites;
				}
				if (botName !== source.name) {
					updatedBotSourceInfo.name = botName;
				}
				if (description !== source.description) {
					updatedBotSourceInfo.description = description;
				}
				if (isBotSourceArchived !== source.archived) {
					updatedBotSourceInfo.archived = isBotSourceArchived;
				}

				newBotSource = await updateBotSource.mutateAsync(updatedBotSourceInfo);

				console.log({
					updatedBotSourceInfo,
					selectedWebCrawls,
					newBotSource,
				});
			}

			console.log("create or edit BotSource", { newBotSource });

			setNextBotSources((prev) => {
				if (!newBotSource) {
					return prev;
				}

				const index = prev.findIndex((s) => s.id === source.id);

				if (index === -1) {
					return [...prev, newBotSource];
				}

				const next = prev.with(index, newBotSource);

				return next;
			});

			editOrCreateSuccessToast(action);

			closeDialog();
		} catch (error) {
			console.error("Error editing or creating bot source:", error);

			toast({
				title: "Error editing or creating bot source!",
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
			});
		} finally {
			setIsLoading(false);
		}
	}

	const handleAddWebsite = () => {
		websitesRef.current.push({
			index_status: GeneralStatus.Not_Started,
			last_index_status_change: null,
			id: Math.random(),
			is_private: false,
			language_code: "",
			website_url: "",
			description: "",
			author: "",
			title: "",
		});

		forceRender();
	};

	const handleRemoveWebsite = (index: number) => {
		websitesRef.current.splice(index, 1);

		forceRender();
	};

	const handleUpdateWebsite = (index: number, value: string) => {
		const website = websitesRef.current[index];

		if (website) {
			website.website_url = value;
		}
	};

	const handleRemoveWebcrawl = (index: number) => {
		setSelectedWebCrawls((prev) => prev.filter((_, i) => i !== index));
	};

	let submitButtonText = "";

	if (isLoading) {
		if (action === BotSourceFormAction.Edit) {
			submitButtonText = "Saving changes...";
		} else {
			submitButtonText = "Creating...";
		}
	} else {
		if (action === BotSourceFormAction.Edit) {
			submitButtonText = "Save changes";
		} else {
			submitButtonText = "Create";
		}
	}

	return (
		<>
			<section className="flex flex-col gap-1 whitespace-nowrap rounded-lg border border-border-smooth  p-2">
				<p className="pl-2 font-bold">
					Websites
					<span className="font-normal tabular-nums">
						{" "}
						({websitesRef.current.length})
					</span>
					:
				</p>

				<ul className="flex flex-col items-center gap-1">
					{websitesRef.current.map((website, urlIndex) => (
						<WebsiteCard
							handleRemoveWebsite={() => handleRemoveWebsite(urlIndex)}
							isOnSource={
								!!source.websites?.find(({ id }) => id === website.id)
							}
							handleUpdateWebsite={handleUpdateWebsite}
							key={Math.random()}
							urlIndex={urlIndex}
							website={website}
						/>
					))}
				</ul>

				<footer className="flex justify-between items-center mt-1">
					<Button
						className="h-fit w-fit px-2 py-1 pr-3"
						variant={ButtonVariant.SUCCESS}
						onClick={handleAddWebsite}
					>
						<Plus className="size-5" />

						<p>Add Website</p>
					</Button>
				</footer>
			</section>

			<section className="flex flex-col gap-1 rounded-lg border border-border-smooth  p-2">
				<div className="flex w-full items-center justify-between">
					<p className="pl-2 font-bold">
						Web Crawls
						<span className="font-normal tabular-nums">
							{" "}
							({selectedWebCrawls.length})
						</span>
						:
					</p>

					<AddWebCrawlDialog
						setSelectedWebCrawls={setSelectedWebCrawls}
						selectedWebCrawls={selectedWebCrawls}
					/>
				</div>

				<ul className="overflow-auto flex max-h-[50vh] flex-nowrap gap-4 py-2 pr-1">
					{selectedWebCrawls.map((webcrawl, webcrawlIndex) => (
						<WebCrawlCard
							handleRemoveWebcrawl={() => handleRemoveWebcrawl(webcrawlIndex)}
							webcrawl={webcrawl}
							key={webcrawlIndex}
						/>
					))}
				</ul>
			</section>

			<DialogFooter className="mr-2 h-full grow">
				<Button
					form={EDIT_OR_CREATE_BOT_SOURCE_FORM_ID}
					variant={ButtonVariant.SUCCESS}
					onClick={handleSendWebForm}
					isLoading={isLoading}
					className="mt-auto"
					type="submit"
				>
					{submitButtonText}
				</Button>
			</DialogFooter>
		</>
	);
};
