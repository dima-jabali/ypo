import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense, startTransition, useState } from "react";

import { AwsImage } from "#/components/aws-image";
import { DownloadAndShowFilePreview } from "#/components/download-and-show-file-preview";
import { FallbackLoader, LoadError } from "#/components/fallback-loader";
import {
	DOCUMENT_TYPES,
	SourceForUserType,
	StandardDocumentContentType,
	type StandardDocumentSourceType,
} from "#/types/chat";
import { DocumentSource, type GeneralFileType } from "#/types/notebook";
import { ErrorBoundary } from "react-error-boundary";
import { useSourcesForUserCtx } from "../ctx";
import { FileMetadataTable } from "../file-metadata-table";
import type { NormalizedSource } from "../get-top-n-sources";
import { HighlightStringWithFilterRegex } from "../highlight-string-with-filter-regex";

type MinimalProps = {
	normalizedSource: Extract<
		NormalizedSource,
		{
			source_type: SourceForUserType.StandardDocument;
			values_type: StandardDocumentSourceType.Minimal;
		}
	>;
};

type VerboseProps = {
	normalizedSource: Extract<
		NormalizedSource,
		{
			source_type: SourceForUserType.StandardDocument;
			values_type: StandardDocumentSourceType.Verbose;
		}
	>;
};

export function StandardDocumentMinimalDetails({
	normalizedSource,
}: MinimalProps) {
	const [isOpen, setIsOpen] = useState(false);

	const sourcesForUserCtx = useSourcesForUserCtx();

	function remeasureHeight(e: React.ToggleEvent<HTMLDetailsElement>) {
		if (e.newState === "closed") {
			requestAnimationFrame(() => {
				sourcesForUserCtx.getState().measure();
			});
		}
	}

	const { values } = normalizedSource;
	const fileType = values.fields.document_type;
	const page = values.fields.page_number;
	const fileStringId = values.id;
	const shouldHaveFilePreview =
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		!DOCUMENT_TYPES.includes(fileType as any) &&
		values.fields.document_source !== DocumentSource.Clickup;

	return (
		<details
			onToggle={(e) => {
				setIsOpen((e.target as HTMLDetailsElement).open);
				remeasureHeight(e);
			}}
			className="open:[&_summary]:max-h-full group"
		>
			<summary className="cursor-pointer max-h-[4lh] overflow-hidden text-xs">
				<span className="group-open:hidden">
					<HighlightStringWithFilterRegex
						string={values.fields.long_text_data?.[0] || ""}
					/>
				</span>
			</summary>

			<div className="flex flex-col gap-2 w-full h-full text-xs">
				{isOpen ? (
					<>
						{shouldHaveFilePreview ? (
							<DownloadAndShowFilePreview
								className="max-h-[500px] w-full max-w-full overflow-auto"
								fileType={fileType as GeneralFileType}
								fileStringId={fileStringId}
								initialPage={page}
								fileId={NaN}
							/>
						) : null}

						<HighlightStringWithFilterRegex
							string={values.fields.long_text_data?.join("") || ""}
						/>
					</>
				) : null}
			</div>
		</details>
	);
}

export function StandardDocumentVerboseDetails({
	normalizedSource,
}: VerboseProps) {
	const [canFetchImage, setCanFetchImage] = useState(false);

	const sourcesForUserCtx = useSourcesForUserCtx();

	function remeasureHeight(e: React.ToggleEvent<HTMLDetailsElement>) {
		if (e.newState === "closed") {
			requestAnimationFrame(() => {
				sourcesForUserCtx.getState().measure();
			});
		}
	}

	const { values } = normalizedSource;

	function fetchAwsImage() {
		startTransition(() => {
			setCanFetchImage(true);
		});
	}

	return (
		<details onToggle={remeasureHeight}>
			<summary
				className="text-xs cursor-pointer my-1 group"
				title="More info about this source"
				onClick={fetchAwsImage}
			>
				<span className="group-hover:underline underline-offset-2">
					More info
				</span>

				{values.metadata ? (
					<FileMetadataTable metadata={values.metadata} />
				) : null}
			</summary>

			<div className="flex flex-col gap-2 w-full max-w-full mt-3 whitespace-pre-wrap">
				{values.content_list?.map((item, index) => {
					const key = `${values.file_name}${index}`;

					switch (item.type) {
						case StandardDocumentContentType.Text: {
							if (
								item.text?.startsWith("START") ||
								item.text?.startsWith("END")
							) {
								return null;
							}

							return (
								<p className="inline" key={key}>
									<HighlightStringWithFilterRegex string={item.text ?? ""} />
								</p>
							);
						}

						case StandardDocumentContentType.ImageUrl: {
							return (
								<Suspense
									fallback={
										<FallbackLoader
											className="w-full aspect-video flex items-center justify-center bg-white/10 rounded-lg"
											fallbackFor="Standard document AWS image"
											title="Loading image from AWS..."
										/>
									}
									key={key}
								>
									<QueryErrorResetBoundary key={key}>
										{({ reset }) => (
											<ErrorBoundary
												fallback={
													<LoadError
														className="text-primary text-sm bg-red-300/30 p-4 rounded-lg flex flex-col items-center justify-center gap-4 w-full aspect-video"
														fallbackFor="Standard document AWS image"
														failedText="Failed to fetch image!"
														key={key}
													/>
												}
												onReset={reset}
												key={key}
											>
												{canFetchImage && item.image_url ? (
													<AwsImage
														aws_bucket={item.image_url.aws_bucket}
														aws_key={item.image_url.aws_key}
														key={key}
													/>
												) : (
													<FallbackLoader
														className="w-full aspect-video flex items-center justify-center bg-white/10 rounded-lg"
														fallbackFor="Standard document AWS image"
														title="Loading image from AWS..."
													/>
												)}
											</ErrorBoundary>
										)}
									</QueryErrorResetBoundary>
								</Suspense>
							);
						}

						default: {
							console.log("Unknown verbose StandardDocumentContentType", {
								item,
							});
							return null;
						}
					}
				})}
			</div>
		</details>
	);
}
