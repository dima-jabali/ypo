import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { DefaultSuspenseAndErrorBoundary } from "./fallback-loader";
import { WithOrganizationIdAndList } from "./with-organization-id-and-list";

export function WithOrganizationIdAndListBoundary({
	withLoader = true,
	fallbackClassName,
	failedText,
	children,
}: React.PropsWithChildren<{
	fallbackClassName?: string;
	withLoader?: boolean;
	failedText: string;
}>) {
			if (typeof window === "undefined") {
		return null;
	}
	
	const organizationId = generalContextStore.use.organizationId();

	return (
		<DefaultSuspenseAndErrorBoundary
			fallbackFor="WithOrganizationIdAndListBoundary"
			fallbackClassName={fallbackClassName}
			failedText={failedText}
			withLoader={withLoader}
			key={organizationId}
		>
			<WithOrganizationIdAndList>{children}</WithOrganizationIdAndList>
		</DefaultSuspenseAndErrorBoundary>
	);
}
