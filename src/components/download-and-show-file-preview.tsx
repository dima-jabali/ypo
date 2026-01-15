import { memo, startTransition, Suspense, useEffect, useState } from "react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import {
	matchGeneralFileTypeToMimeType,
	MimeType,
	useFetchFileById,
} from "#/hooks/fetch/use-fetch-file-by-id";
import type { GeneralFileType } from "#/types/notebook";
import { CsvToHtmlTable } from "./csv-to-html-table";
import { FallbackLoader, LoadError } from "./fallback-loader";
import { NativePdfViewer } from "./native-pdf-viewer";
import type {
	AwsBucket,
	AwsKey,
} from "#/hooks/fetch/use-fetch-all-organizations";

type Props = {
	aws_bucket?: AwsBucket | null | undefined;
	fallbackClassName?: string | undefined;
	fileType: GeneralFileType | MimeType;
	aws_key?: AwsKey | null | undefined;
	fileStringId?: string | undefined;
	initialPage?: number | undefined;
	className?: string | undefined;
	fileId: number;
};

export const DownloadAndShowFilePreview: React.FC<Props> = memo(
	function DownloadAndShowFilePreview({
		fileStringId,
		initialPage,
		aws_bucket,
		className,
		fileType,
		aws_key,
		fileId,
	}) {
		const mimeType = matchGeneralFileTypeToMimeType(fileType);

		const organizationId = generalContextStore.use.organizationId();
		const blobQuery = useFetchFileById({
			fileType: mimeType,
			organizationId,
			fileStringId,
			aws_bucket,
			aws_key,
			fileId,
		});

		if (blobQuery.isPending) {
			return <FallbackLoader fallbackFor="DownloadAndShowFilePreview" />;
		}
		if (blobQuery.isError) {
			return (
				<LoadError
					failedText="Failed to load file preview!"
					fallbackFor="DownloadAndShowFilePreview"
					error={blobQuery.error}
				/>
			);
		}

		switch (mimeType) {
			case MimeType.Csv:
				return <CsvPreview className={className} blob={blobQuery.data} />;

			case MimeType.Pdf:
				return (
					<PdfPreview
						initialPage={initialPage}
						blob={blobQuery.data}
						className={className}
					/>
				);

			case MimeType.Image:
				return <ImagePreview className={className} blob={blobQuery.data} />;

			default:
				return null;
		}
	},
);

const CsvPreview: React.FC<{ blob: Blob; className?: string | undefined }> = ({
	className,
	blob,
}) => {
	const [csvText, setCsvText] = useState("");

	useEffect(() => {
		startTransition(async () => {
			setCsvText(await blob.text());
		});
	}, [blob]);

	return (
		<Suspense fallback={<FallbackLoader fallbackFor="CsvPreview" />}>
			<CsvToHtmlTable className={className} csv={csvText} />
		</Suspense>
	);
};

const PdfPreview: React.FC<{
	initialPage?: number | undefined;
	className?: string | undefined;
	blob: Blob;
}> = ({ className, blob }) => {
	const [fileUrl, setFileUrl] = useState("");

	useEffect(() => {
		const blobFileUrl = URL.createObjectURL(blob);

		setFileUrl(blobFileUrl);

		return () => URL.revokeObjectURL(blobFileUrl);
	}, [blob]);

	return fileUrl ? (
		<NativePdfViewer fileBlobUrl={fileUrl} className={className} />
	) : null;
};

const ImagePreview: React.FC<{
	className?: string | undefined;
	blob: Blob;
}> = ({ className, blob }) => {
	const [imgSrc, setImgUrl] = useState("");

	useEffect(() => {
		const blobFileUrl = URL.createObjectURL(blob);

		setImgUrl(blobFileUrl);

		return () => URL.revokeObjectURL(blobFileUrl);
	}, [blob]);

	return imgSrc ? <img className={className} src={imgSrc} alt="" /> : null;
};
