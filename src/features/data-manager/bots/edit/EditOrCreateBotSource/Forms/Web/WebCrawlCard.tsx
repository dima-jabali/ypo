import { AxiosError } from "axios";
import { X } from "lucide-react";
import { useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import { Input } from "#/components/Input";
import { StyledTextarea } from "#/components/styled-text-area";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { getErrorMessage } from "#/helpers/utils";
import { CrawlStatus, type WebCrawl } from "#/types/bot-source";
import { useIndexWebCrawl } from "#/hooks/mutation/use-index-web-crawl";

export const WebCrawlCard: React.FC<{
	webcrawl: WebCrawl;
	handleRemoveWebcrawl: () => void;
}> = ({ webcrawl, handleRemoveWebcrawl }) => {
	const [isSendingIndexRequest, setIsSendingIndexRequest] = useState(false);

	const indexWebCrawl = useIndexWebCrawl();

	const isIndexingWebcrawl = webcrawl.crawl_status === CrawlStatus.In_Progress;

	const handleIndexWebcrawl = async () => {
		try {
			setIsSendingIndexRequest(true);

			await indexWebCrawl.mutateAsync(webcrawl.id);

			toast({
				title: "Web Crawl indexing in progress",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			console.error("Error indexing Web Crawl:", error);

			let description = "";

			if (error instanceof AxiosError) {
				if (typeof error.response?.data === "string") {
					description = error.response.data;
				} else if (
					error.response?.data &&
					"error" in error.response.data &&
					typeof error.response.data.error === "string"
				) {
					description = error.response.data.error;
				}
			} else if (getErrorMessage(error)) {
				description = getErrorMessage(error)!;
			} else {
				description = "Unknown error. Check the console.";
			}

			toast({
				title: "Failed to index Web Crawl!",
				variant: ToastVariant.Destructive,
				description,
			});
		} finally {
			setIsSendingIndexRequest(false);
		}
	};

	return (
		<article className="flex w-72 h-[40vh] flex-none flex-col gap-2 rounded-lg border-2 border-border-smooth p-2 simple-scrollbar">
			<section className="simple-scrollbar relative flex w-full h-[calc(100%-2.5rem-1rem-1px)] max-w-full flex-none flex-col gap-4">
				<button
					className="absolute right-1 top-1 flex size-5 flex-none items-center justify-center rounded-full bg-destructive/30 onfocus:bg-destructive/70 active:bg-destructive"
					onClick={handleRemoveWebcrawl}
					title="Remove Web Crawl"
					type="button"
				>
					<X className="size-4" />
				</button>

				<fieldset className="flex items-center gap-4">
					<p className="text-sm font-bold">Name</p>

					<Input defaultValue={webcrawl.name} className="mr-7" readOnly />
				</fieldset>

				<fieldset className="flex items-center gap-4">
					<p className="whitespace-nowrap text-sm font-bold">Max results</p>

					<Input defaultValue={webcrawl.max_results} type="number" readOnly />
				</fieldset>

				<fieldset className="flex flex-col gap-1 text-left">
					<p className="text-sm font-bold">Description</p>

					<StyledTextarea defaultValue={webcrawl.description} readOnly />
				</fieldset>

				<fieldset className="flex flex-col gap-1 text-left">
					<p className="text-sm font-bold">
						Start URLs
						<span className="font-normal tabular-nums">
							{" "}
							({webcrawl.start_urls.length})
						</span>
						:
					</p>

					{webcrawl.start_urls.map((startURL) => (
						<Input defaultValue={startURL} key={startURL} readOnly />
					))}
				</fieldset>

				<fieldset className="flex flex-col gap-1 text-left">
					<p className="text-sm font-bold">
						Websites
						<span className="font-normal tabular-nums">
							{" "}
							({webcrawl.websites.length})
						</span>
						:
					</p>

					{webcrawl.websites.map((website) => (
						<Input
							defaultValue={website.website_url}
							key={website.id}
							readOnly
						/>
					))}
				</fieldset>
			</section>

			<hr className="border-border-smooth" />

			<footer className="flex h-10">
				<Button
					className="h-10 data-[is-indexing=true]:bg-primary w-full"
					isLoading={isSendingIndexRequest}
					variant={ButtonVariant.PURPLE}
					disabled={isIndexingWebcrawl}
					onClick={handleIndexWebcrawl}
				>
					Index{isSendingIndexRequest || isIndexingWebcrawl ? "ing" : ""} Web
					Crawl
					{isSendingIndexRequest || isIndexingWebcrawl ? "..." : ""}
				</Button>
			</footer>
		</article>
	);
};
