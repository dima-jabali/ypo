import { useState } from "react";

import { useAwsBase64File } from "#/hooks/mutation/use-aws-base64-file";
import { type FetchAwsImageProps } from "#/hooks/mutation/use-download-aws-image";
import { LoadError } from "./fallback-loader";

export function AwsBase64File({
	className,
	fallback,
	...rest
}: FetchAwsImageProps & { className?: string; fallback?: React.ReactNode }) {
	const [hasError, setHasError] = useState(false);

	const awsBase64FileQuery = useAwsBase64File(rest);

	if (awsBase64FileQuery.isPending) {
		return null;
	}

	if (awsBase64FileQuery.isError) {
		return (
			fallback ?? (
				<LoadError
					failedText="Failed to load file preview!"
					error={awsBase64FileQuery.error}
					fallbackFor="AwsImage"
				/>
			)
		);
	}

	function handleError() {
		setHasError(true);
	}

	return hasError ? null : (
		<img
			src={awsBase64FileQuery.data}
			className={className}
			onError={handleError}
			alt=""
		/>
	);
}
