import { useEffect, useRef, useState } from "react";

import {
	generalContextStore,
	SidebarTab,
} from "#/contexts/general-ctx/general-context";
import { useNotebookBlocks } from "#/hooks/fetch/use-fetch-notebook";

export function useFocusedBlock() {
	const [focusedBlockUUID, setFocusedBlockUUID] = useState("");

	const lastActiveElementRef = useRef(document.activeElement);

	const notebookBlocks = useNotebookBlocks();

	const sidebarTab = generalContextStore.use.sidebarTab();

	const focusedBlock = notebookBlocks.find(
		(block) => block.uuid === focusedBlockUUID,
	);

	const isAITabOpen = sidebarTab === SidebarTab.Outline;

	useEffect(() => {
		if (!isAITabOpen) return;

		function onBlur() {
			// Do logic related to blur using document.activeElement;
			// You can do change detection too using lastActiveElement as a history

			isSameActiveElement();
		}

		function isSameActiveElement() {
			const currentActiveElement = document.activeElement;

			if (lastActiveElementRef.current !== currentActiveElement) {
				lastActiveElementRef.current = currentActiveElement;

				return false;
			}

			return true;
		}

		function onFocus() {
			// Add logic to detect focus and to see if it has changed or not from the lastActiveElement.

			isSameActiveElement();

			// Try to find a parent element that has the attribute
			// `data-sql-block-uuid`. That will be the sql block
			// that is currently focused.
			const possibleFocusedBlock =
				document.activeElement?.closest("[data-block-uuid]");

			const blockUUID = possibleFocusedBlock?.getAttribute("data-block-uuid");

			setFocusedBlockUUID(blockUUID ?? "");
		}

		document.addEventListener("focus", onFocus, true);
		document.addEventListener("blur", onBlur, true);

		return () => {
			document.removeEventListener("focus", onFocus, true);
			document.removeEventListener("blur", onBlur, true);
		};

		// Only listen if the AI or the outline tab is open:
	}, [isAITabOpen]);

	return {
		allBlocks: notebookBlocks,
		focusedBlock,
	};
}
