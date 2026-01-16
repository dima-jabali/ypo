import { KeyCode, KeyMod, type editor as MonacoEditorType, type Position } from "monaco-editor";
import { useEffect, useRef } from "react";

import { useWithBotConversationId } from "#/contexts/general-ctx/general-context";
import { allEditorsInfo, type MonacoEditorInfo } from "#/contexts/monaco-editors-info";
import { useWebsocketStore } from "#/contexts/Websocket/context";
import { AUTOCOMPLETE_TRIGGER_TIMER } from "#/helpers/monaco-editor";
import { useDownloadedNotebookId } from "#/hooks/fetch/use-fetch-notebook";
import type { NormalMonacoEditorProps } from "./normal-monaco-editor";
import { triggerWebsocketAutocomplete } from "./trigger-autocomplete-with-websocket";
import { useBlockStore } from "#/contexts/block-context";

type DisposeOfMonacoEditorListeners = () => void;
type RemoveFromAllEditorsInfo = () => void;

const STOPWORD_REGEX = /[.,\s]/g;

export function HandleSetupAutocomplete({
  selectedDatabase,
  isBlockReadonly,
  blockUuid,
}: NormalMonacoEditorProps) {
  const botConversationId = useWithBotConversationId();
  const notebookId = useDownloadedNotebookId();
  const websocketStore = useWebsocketStore();
  const blockStore = useBlockStore();
  const monacoEditor = blockStore.use.monacoEditor();

  const autocompleteTriggerTimerRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(
    function setupAutocomplete() {
      if (isBlockReadonly || !monacoEditor) {
        return;
      }

      function setupNeededValuesForAutoCompletionSuggestions(
        genericEditor: MonacoEditorType.IStandaloneCodeEditor,
      ): RemoveFromAllEditorsInfo | undefined {
        const modelId = genericEditor.getModel()?.id;

        if (!(modelId && selectedDatabase?.type)) return;

        const editorInfo: MonacoEditorInfo = {
          shouldShowTheSamePreviousAutocomplete: false,
          connection_type: selectedDatabase.type,
          websocketRoundwayTripStartTime: NaN,
          connection_id: selectedDatabase.id,
          serverSuggestionsResponse: null,
          monacoEditor: genericEditor,
          lastCursorPosition: null,
          project_id: notebookId,
          block_uuid: blockUuid,
          botConversationId,
          suggestions: [],
          lastWord: "",
          range: null,
          sql: "",
        };

        allEditorsInfo.set(modelId, editorInfo);

        return () => allEditorsInfo.delete(modelId);
      }

      const removeInfos: (RemoveFromAllEditorsInfo | undefined)[] = [];

      function setupEditorListeners(
        genericEditor: MonacoEditorType.IStandaloneCodeEditor,
      ): DisposeOfMonacoEditorListeners | undefined {
        const model = genericEditor.getModel();
        const modelId = model?.id;

        if (!(modelId && model)) {
          console.info("Model ID is not defined!", { genericEditor });

          return;
        }

        const runWebsocketAutocomplete = () =>
          triggerWebsocketAutocomplete({ modelId, websocketStore });

        const setWebsocketAutocompleteTriggerTimer = () => {
          clearTimeout(autocompleteTriggerTimerRef.current);

          autocompleteTriggerTimerRef.current = setTimeout(
            runWebsocketAutocomplete,
            AUTOCOMPLETE_TRIGGER_TIMER,
          );
        };

        // Trigger autocomplete on Ctrl+Space:
        const onCtrlSpaceListener = genericEditor.addAction({
          keybindings: [KeyMod.WinCtrl | KeyCode.Space],
          label: "Trigger Websocket autocomplete",
          id: "trigger-websocket-autocomplete",
          run: runWebsocketAutocomplete,
        });

        // Trigger autocomplete when typing:
        let lastWordAtPosition: MonacoEditorType.IWordAtPosition | null | undefined;
        let lastCursorPosition: Position | null = null;

        const onKeyDownListener = genericEditor.onKeyDown((e) => {
          clearTimeout(autocompleteTriggerTimerRef.current);

          const shouldNotTriggerAutocomplete =
            e.altGraphKey || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey;

          if (shouldNotTriggerAutocomplete) return;

          // On an autocomplete suggestion accepted, trigger it again:
          if (e.code === "Tab") {
            setWebsocketAutocompleteTriggerTimer();

            return;
          }

          const editorData = allEditorsInfo.get(modelId);
          const position = genericEditor.getPosition();

          if (!(position && editorData)) return;

          // This will prevent triggering autocomplete when the user
          // is selecting a suggestion from the suggest widget:
          const isCursorOnSamePosition = lastCursorPosition && position.equals(lastCursorPosition);

          if (isCursorOnSamePosition) return;

          const wordAtPosition = model.getWordAtPosition(position);

          if (wordAtPosition) {
            const cursorLinearPosition = model.getOffsetAt(position);
            const allString = model.getValue();
            const wordUntilCursor = allString.slice(
              wordAtPosition.startColumn - 1,
              cursorLinearPosition + 1,
            );

            // `wordAtPosition.word` only catches the word, not any whitespace
            // that the user's cursor may have been in, so we need to check
            // for whitespaces or stopwords:
            STOPWORD_REGEX.lastIndex = 0;
            const hasEncounteredStopWordChar = STOPWORD_REGEX.test(wordUntilCursor);

            const isCursorWalkingOnSameWord =
              wordAtPosition &&
              lastWordAtPosition &&
              wordAtPosition.word === lastWordAtPosition.word;

            const alreadyHasAutocomplete = editorData.suggestions.length > 0;

            const shouldSkipAutocompleteTrigger =
              !hasEncounteredStopWordChar && isCursorWalkingOnSameWord && alreadyHasAutocomplete;

            if (shouldSkipAutocompleteTrigger) return;

            setWebsocketAutocompleteTriggerTimer();
          }

          lastWordAtPosition = wordAtPosition;
          lastCursorPosition = position;
        });

        // If you click out of the Monaco editor, then later click back in (and the cursor is in the same place), show the same previous autosuggestions:
        let focusedOutOfMonacoEditor = false;

        const onDidBlurListener = genericEditor.onDidBlurEditorText(() => {
          focusedOutOfMonacoEditor = true;

          const lastCursorPosition = genericEditor.getPosition();
          const editorData = allEditorsInfo.get(modelId);

          if (lastCursorPosition && editorData) {
            editorData.lastCursorPosition = lastCursorPosition;
          }
        });
        const onDidFocusListener = genericEditor.onDidFocusEditorText(() => {
          if (!focusedOutOfMonacoEditor) return;

          focusedOutOfMonacoEditor = false;

          const currentCursorPosition = genericEditor.getPosition();
          const editorData = allEditorsInfo.get(modelId);

          if (!(editorData && editorData.lastCursorPosition && currentCursorPosition)) return;

          const arePositionsEqual = currentCursorPosition.equals(editorData.lastCursorPosition);

          editorData.shouldShowTheSamePreviousAutocomplete = arePositionsEqual;

          if (arePositionsEqual) {
            genericEditor.trigger(
              "same-position-autocomplete-trigger",
              "editor.action.triggerSuggest",
              // When triggering completions manually, Monaco never hides the widget,
              // so we need this in order for it to behave as if it would have been
              // triggered automatically:
              { auto: true },
            );
          }
        });

        return () => {
          onCtrlSpaceListener.dispose();
          onDidFocusListener.dispose();
          onDidBlurListener.dispose();
          onKeyDownListener.dispose();
        };
      }

      const listenersDisposers: (DisposeOfMonacoEditorListeners | undefined)[] = [];

      if (monacoEditor) {
        listenersDisposers.push(setupEditorListeners(monacoEditor));

        removeInfos.push(setupNeededValuesForAutoCompletionSuggestions(monacoEditor));
      }
      // if (monacoDiffEditor) {
      // 		listenersDisposers.push(setupSqlEditorListeners(monacoDiffEditor.getModifiedEditor()));
      // listenersDisposers.push(setupSqlEditorListeners(monacoDiffEditor.getOriginalEditor()));

      // 	removeInfos.push(
      // 		setupNeededValuesForAutoCompletionSuggestions(monacoDiffEditor.getOriginalEditor()),
      // 	);
      // 	removeInfos.push(
      // 		setupNeededValuesForAutoCompletionSuggestions(monacoDiffEditor.getModifiedEditor()),
      // 	);
      // }

      return () => {
        listenersDisposers.forEach((dispose) => dispose?.());

        removeInfos.forEach((remove) => remove?.());
      };
    },
    [
      botConversationId,
      selectedDatabase,
      isBlockReadonly,
      websocketStore,
      monacoEditor,
      notebookId,
      blockUuid,
    ],
  );

  return null;
}
