import { useBatchTableColumnsArray } from "../../hooks/get/use-fetch-batch-table-by-id";
import {
	MentionablesProvider,
	useMentionablesStore,
} from "./mentionables-context";

export function BatchTableMentionablesProvider({
	children,
}: React.PropsWithChildren) {
	return (
		<MentionablesProvider>
			<SetBatchTableMentionablesValues />

			{children}
		</MentionablesProvider>
	);
}

function SetBatchTableMentionablesValues() {
	const columns = useBatchTableColumnsArray();

	useMentionablesStore().setState({ mentionables: columns });

	return null;
}
