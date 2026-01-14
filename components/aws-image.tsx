import { cn } from "#/helpers/class-names";
import {
	useDownloadAwsImage,
	type FetchAwsImageProps,
} from "#/hooks/mutation/use-download-aws-image";
import { FallbackLoader, LoadError } from "./fallback-loader";

export function AwsImage({
	className,
	...rest
}: FetchAwsImageProps & { className?: string }) {
	const imgQuery = useDownloadAwsImage(rest);

	if (imgQuery.isPending) {
		return <FallbackLoader fallbackFor="AwsImage" />;
	}
	if (imgQuery.isError) {
		return (
			<LoadError
				failedText="Failed to load file preview!"
				error={imgQuery.error}
				fallbackFor="AwsImage"
			/>
		);
	}

	return (
		<img
			className={cn("w-full object-fill rounded-lg", className)}
			alt="File downloaded from AWS"
			src={imgQuery.data}
		/>
	);
}
