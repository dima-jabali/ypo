import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { useDownloadedNotebookId } from "#/hooks/fetch/use-fetch-notebook";
import { Outline } from "./outline";
import { SimilarQueriesOfBlock } from "./similar-queries-of-block";

export function NotebookOutline() {
	const similarQueriesToShow = generalContextStore.use.similarQueriesToShow();

	const notebookId = useDownloadedNotebookId();

	return similarQueriesToShow ? (
		<SimilarQueriesOfBlock key={notebookId} />
	) : (
		<Outline key={notebookId} />
	);
}
