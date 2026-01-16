import type { languages } from "monaco-editor";
import { useMonaco } from "@monaco-editor/react";
import { memo, useEffect } from "react";

import { makeSortTextStringsAndInserThem } from "./helpers";
import { allEditorsInfo, type MonacoEditorInfo } from "#/contexts/monaco-editors-info";
import { SuggestionType, type Suggestion } from "#/types/auto-suggestion";

export type MonacoType = NonNullable<ReturnType<typeof useMonaco>>;

const DATABASE_DETAIL = "Database";
const SCHEMATA_DETAIL = "Schemata";
const KEYWORD_DETAIL = "Keyword";
const TABLE_DETAIL = "Table";
const FIELD_DETAIL = "Field";

const DEFAULT_SUGGESTIONS = { suggestions: [], incomplete: false };

export const provideSQLCompletion = (monaco: MonacoType): languages.CompletionItemProvider => ({
  provideCompletionItems(model) {
    const editorData = allEditorsInfo.get(model.id);

    if (!editorData) {
      console.info("provideSQLCompletion: no editor data", {
        allEditorsInfo,
        model,
      });

      return DEFAULT_SUGGESTIONS;
    }

    const suggestions = editorData.shouldShowTheSamePreviousAutocomplete
      ? editorData.suggestions
      : [];

    editorData.suggestions = suggestions;

    // If you click out of the Monaco editor, then later click back in (and the cursor is in the same place), show the same previous autosuggestions:
    if (editorData.shouldShowTheSamePreviousAutocomplete) {
      editorData.shouldShowTheSamePreviousAutocomplete = false;

      if (suggestions.length === 0) {
        // If there are no suggestions, cancel current suggestions so the user can trigger another one:
        requestAnimationFrame(() => {
          editorData.monacoEditor?.trigger(
            "close-already-open-suggestion-widget",
            "hideSuggestWidget",
            null,
          );
        });
      }

      return { suggestions, incomplete: false };
    }

    transformToCompletionItems(editorData, suggestions, monaco);

    makeSortTextStringsAndInserThem(suggestions);

    const end = performance.now();

    console.log(
      `websocket roundway trip took ${end - editorData.websocketRoundwayTripStartTime}ms`,
      {
        allEditorsInfo,
        suggestions,
      },
    );

    editorData.websocketRoundwayTripStartTime = NaN;

    if (suggestions.length === 0) {
      // If there are no suggestions, cancel current suggestions so the user can trigger another one:
      requestAnimationFrame(() => {
        editorData.monacoEditor?.trigger(
          "close-already-open-suggestion-widget",
          "hideSuggestWidget",
          null,
        );
      });
    }

    return { suggestions, incomplete: false };
  },
});

function transformToCompletionItems(
  data: MonacoEditorInfo,
  suggestions: languages.CompletionList["suggestions"],
  monaco: MonacoType,
) {
  const { serverSuggestionsResponse, lastWord, range } = data;

  if (!serverSuggestionsResponse) {
    console.info("No `serverSuggestionsResponse` provided!");

    return;
  }
  if (!range) {
    console.info("No `range` provided!");

    return;
  }

  const {
    suggestions: serverSuggestions,
    is_column = false,
    is_table = false,
  } = serverSuggestionsResponse;

  if (!serverSuggestions || serverSuggestions.length === 0) {
    return;
  }

  for (const suggestion of serverSuggestions) {
    switch (suggestion.suggestion_type) {
      case SuggestionType.DATABASE: {
        // Casting cause I couldn't find a way to make ts narrow it down:
        const { database_name } = (suggestion as Suggestion<SuggestionType.DATABASE>).suggestion;

        if (database_name === lastWord) continue;

        let insertText = database_name;

        if (is_table || is_column) {
          insertText = `${database_name}.`;
        } else {
          insertText = `${database_name} `;
        }

        suggestions.push({
          kind: monaco.languages.CompletionItemKind.Constant,
          detail: DATABASE_DETAIL,
          label: database_name,
          insertText,
          range,
        });

        break;
      }

      case SuggestionType.SCHEMATA: {
        const { schemata_name, database_name } = (suggestion as Suggestion<SuggestionType.SCHEMATA>)
          .suggestion;

        if (schemata_name === lastWord) continue;

        const detail = `${SCHEMATA_DETAIL}.\n Database Name: '${database_name}'`;

        let insertText = schemata_name;

        if (is_table || is_column) {
          insertText = `${schemata_name}.`;
        } else {
          insertText = `${schemata_name} `;
        }

        suggestions.push({
          kind: monaco.languages.CompletionItemKind.Constant,
          label: schemata_name,
          insertText,
          detail,
          range,
        });

        break;
      }

      case SuggestionType.TABLE: {
        const { schemata_name, database_name, table_name } = (
          suggestion as Suggestion<SuggestionType.TABLE>
        ).suggestion;

        if (table_name === lastWord) continue;

        const detail = `${TABLE_DETAIL}.\n Database Name: '${database_name}'.\n Schemata Name: '${schemata_name}'`;

        let insertText = table_name;

        if (is_table) {
          insertText = `${table_name} `;
        } else if (is_column) {
          insertText = `${table_name}.`;
        }

        suggestions.push({
          kind: monaco.languages.CompletionItemKind.Constant,
          label: table_name,
          insertText,
          detail,
          range,
        });

        break;
      }

      case SuggestionType.FIELD: {
        const { field_name, schemata_name, database_name, table_name } = (
          suggestion as Suggestion<SuggestionType.FIELD>
        ).suggestion;

        if (field_name === lastWord) continue;

        const detail = `${FIELD_DETAIL}.\n Database Name: '${database_name}'.\n Schemata Name: '${schemata_name}'.\n Table Name: '${table_name}'`;

        suggestions.push({
          kind: monaco.languages.CompletionItemKind.Constant,
          insertText: `${field_name} `,
          label: field_name,
          detail,
          range,
        });

        break;
      }

      case SuggestionType.KEYWORD: {
        const { keyword } = (suggestion as Suggestion<SuggestionType.KEYWORD>).suggestion;

        if (keyword === lastWord) continue;

        suggestions.push({
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: `${keyword} `,
          detail: KEYWORD_DETAIL,
          label: keyword,
          range,
        });

        break;
      }

      default:
        console.info("Unknown suggestion type:", { suggestion });
        break;
    }
  }
}

export const AddCompletionProviderToMonacoEditor = memo(
  function AddCompletionProviderToMonacoEditor() {
    const monaco = useMonaco();

    useEffect(() => {
      if (!monaco) {
        console.log("Skipping completion provider setup, no monaco.");

        return;
      } else {
        console.log("Adding completion provider to monaco.");
      }

      const disposables = [
        monaco.languages.registerCompletionItemProvider("sql", provideSQLCompletion(monaco)),

        monaco.editor.addKeybindingRules([
          {
            // Disable default trigger of auto completion:
            keybinding: monaco.KeyMod.WinCtrl | monaco.KeyCode.Space,
            command: null,
          },
        ]),
      ];

      return () => {
        disposables.forEach((d) => d.dispose());
      };
    }, [monaco]);

    return null;
  },
);
