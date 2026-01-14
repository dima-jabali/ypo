import { dataManagerStore } from "#/contexts/data-manager";
import {
	generalContextStore,
	MainPage,
} from "#/contexts/general-ctx/general-context";

export function handleGoToSapien() {
	generalContextStore.setState({
		mainPage: MainPage.Sapien,
		botConversationId: null,
		batchTableId: null,
		notebookId: null,
	});

	dataManagerStore.setState(dataManagerStore.getInitialState());
}
