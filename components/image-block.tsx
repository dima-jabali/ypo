import { memo } from "react";

import { droppedFiles } from "#/contexts/dropped-files";
import { type BlockImage, GeneralFileType } from "#/types/notebook";
import { LOADER } from "../Button";
import { DownloadAndShowFilePreview } from "../download-and-show-file-preview";
import { AddBlockBelowButton } from "./add-block-below-button";
import { DeleteBlockFloatingButton } from "../delete-block-floating-button";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

export const ImageBlock = memo(function ImageBlock({
	imageBlock,
}: {
	imageBlock: BlockImage;
}) {
	const isNotebookMode = generalContextStore.use.isNotebookMode();

	const previewUrl = imageBlock.custom_block_info?.preview_url;
	const awsBucket = imageBlock.custom_block_info?.aws_bucket;
	const awsKey = imageBlock.custom_block_info?.aws_key;
	const hasImage = Boolean((awsBucket && awsKey) || previewUrl);

	{
		// Handle uploading dropped file: (this is already done when sending a msg in chat)

		const droppedFile = droppedFiles.get(imageBlock.uuid);

		if (droppedFile) {
			droppedFiles.delete(imageBlock.uuid);
		}
	}

	return (
		<article
			className="w-full flex flex-col group/block"
			data-delete-block-before={isNotebookMode}
			id={imageBlock.uuid}
			title="Image block"
		>
			{hasImage ? (
				previewUrl ? (
					<img
						className="block w-full max-w-full cursor-pointer object-cover rounded-md"
						src={previewUrl}
						alt=""
					/>
				) : (
					<DownloadAndShowFilePreview
						className="block w-full max-w-full cursor-pointer object-cover rounded-md"
						fileType={GeneralFileType.IMAGE}
						aws_bucket={awsBucket}
						aws_key={awsKey}
						fileId={NaN}
					/>
				)
			) : (
				<div className="relative h-[100px] overflow-hidden border border-border-smooth flex items-center justify-center rounded-lg">
					{LOADER}
				</div>
			)}

			<AddBlockBelowButton blockAboveUuid={imageBlock.uuid} />

			<DeleteBlockFloatingButton blockUuid={imageBlock.uuid} />
		</article>
	);
});
