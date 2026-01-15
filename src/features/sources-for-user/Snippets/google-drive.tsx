import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense, startTransition, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { AwsImage } from "#/components/aws-image";
import { FallbackLoader, LoadError } from "#/components/fallback-loader";
import {
	GoogleDriveContentType,
	SourceForUserType,
	type GoogleDriveSourceType,
} from "#/types/chat";
import { FileMetadataTable } from "../file-metadata-table";
import type { NormalizedSource } from "../get-top-n-sources";
import { HighlightStringWithFilterRegex } from "../highlight-string-with-filter-regex";
import { useSourcesForUserCtx } from "../ctx";

type MinimalProps = {
	normalizedSource: Extract<
		NormalizedSource,
		{
			source_type: SourceForUserType.GoogleDrive;
			values_type: GoogleDriveSourceType.Minimal;
		}
	>;
};

type VerboseProps = {
	normalizedSource: Extract<
		NormalizedSource,
		{
			source_type: SourceForUserType.GoogleDrive;
			values_type: GoogleDriveSourceType.Verbose;
		}
	>;
};

export function GoogleDriveMinimalDetails({ normalizedSource }: MinimalProps) {
	const sourcesForUserCtx = useSourcesForUserCtx();

	function remeasureHeight(e: React.ToggleEvent<HTMLDetailsElement>) {
		if (e.newState === "closed") {
			requestAnimationFrame(() => {
				sourcesForUserCtx.getState().measure();
			});
		}
	}

	const { values } = normalizedSource;

	return (
		<details className="open:[&_summary]:max-h-full" onToggle={remeasureHeight}>
			<summary className="cursor-pointer max-h-[4lh] overflow-hidden">
				<HighlightStringWithFilterRegex
					string={values.fields.long_text_data?.[0] || ""}
				/>
			</summary>

			<p>
				<HighlightStringWithFilterRegex
					string={values.fields.long_text_data?.slice(1).join("") || ""}
				/>
			</p>
		</details>
	);
}

export function GoogleDriveVerboseDetails({ normalizedSource }: VerboseProps) {
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
	const title = `${values.file_name ?? ""}`;
	const contentList = values.content_list;

	const fetchAwsImage = () => {
		startTransition(() => {
			setCanFetchImage(true);
		});
	};

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

			<div className="flex flex-col gap-2 w-full max-w-full mt-3 text-xs">
				{contentList.map((item, index) => {
					const key = `${title}${index}`;

					switch (item.type) {
						case GoogleDriveContentType.Text: {
							return (
								<p key={key}>
									<HighlightStringWithFilterRegex string={item.text} />
								</p>
							);
						}

						case GoogleDriveContentType.ImageUrl: {
							return (
								<Suspense
									fallback={
										<FallbackLoader
											className="w-full aspect-video flex items-center justify-center bg-white/10 rounded-lg"
											fallbackFor="Google Drive AWS image"
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
														fallbackFor="Google Drive AWS image"
														failedText="Failed to fetch image!"
														key={key}
													/>
												}
												onReset={reset}
												key={key}
											>
												{canFetchImage ? (
													<AwsImage
														aws_bucket={item.image_url.aws_bucket}
														aws_key={item.image_url.aws_key}
														key={key}
													/>
												) : (
													<FallbackLoader
														className="w-full aspect-video flex items-center justify-center bg-white/10 rounded-lg"
														fallbackFor="Google Drive AWS image"
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
							console.log("Unknown verbose GoogleDriveContentType", {
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
