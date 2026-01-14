import { useEditorMounted, useEditorState } from "platejs/react";
import { useEffect, useState } from "react";
import { Editor } from "slate";

import { useTableUIStore } from "../../contexts/table-ui";

export function KeepFocusOnPlateEditor() {
	const isSelectingRangeForFormula =
		useTableUIStore().use.isSelectingRangeForFormula();
	const plateEditor = useEditorState();
	const isMounted = useEditorMounted(); // Returns false if no editor is mounted

	const [isFirstMount, setIsFirstMount] = useState(true);

	useEffect(() => {
		if (!isMounted) return;

		let hasInitialFocus = false;

		if (isFirstMount) {
			// Place cursor on end of string.

			try {
				const start = Editor.start(plateEditor as unknown as Editor, []);
				const end = Editor.end(plateEditor as unknown as Editor, []);

				plateEditor.tf.select({ anchor: start, focus: end });

				plateEditor.tf.focus({ at: { anchor: end, focus: end } });

				hasInitialFocus = true;
			} catch (error) {
				console.log(
					"Failed to place cursor on end of string (KeepFocusOnPlateEditor)!",
					{
						plateEditor,
						error,
					},
				);
			}
		}

		if (!isSelectingRangeForFormula && !isFirstMount) return;

		setIsFirstMount(false);

		if (hasInitialFocus) return;

		try {
			const end = Editor.end(plateEditor as unknown as Editor, []);

			plateEditor.tf.focus({ at: { anchor: end, focus: end } });
		} catch (error) {
			console.log("Failed to select editor (KeepFocusOnPlateEditor)!", {
				plateEditor,
				error,
			});
		}
	}, [isFirstMount, isMounted, isSelectingRangeForFormula, plateEditor]);

	return null;
}
