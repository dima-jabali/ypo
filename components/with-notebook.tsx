import { Fragment } from "react";

import { useDownloadedNotebookUuid } from "#/hooks/fetch/use-fetch-notebook";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

export function WithNotebook({ children }: React.PropsWithChildren) {
	const organizationId = generalContextStore.use.organizationId();
	const notebookUuid = useDownloadedNotebookUuid();

	return (
		<Fragment key={`${notebookUuid}-${organizationId}`}>{children}</Fragment>
	);
}
