import type { IRange } from "monaco-editor";

import { allEditorsInfo, type MonacoEditorInfo } from "#/contexts/monaco-editors-info";
import type { WebsocketContextType } from "#/contexts/Websocket/context";
import {
  sendWebSocketMessage,
  type ExtraDataForEachMessage,
} from "#/contexts/Websocket/websocket-state-machine";
import { createRequestId, isValidNumber } from "#/helpers/utils";
import { DatabaseConnectionType } from "#/types/databases";
import { WebsocketAction, type WebSocketAutocompletePayload } from "#/types/websocket";

const CURSOR_POINTER = "<<";

export function triggerWebsocketAutocomplete({
  websocketStore,
  modelId,
}: {
  websocketStore: WebsocketContextType;
  modelId: string;
}) {
  console.log("Triggering websocket autocomplete.", { modelId });

  const editorData = allEditorsInfo.get(modelId);

  if (!editorData) {
    console.error("`editorData` is not defined!");

    return;
  }

  const monacoEditor = editorData.monacoEditor;

  if (!monacoEditor) {
    console.error("Monaco editor is not defined!");

    return;
  }

  // We can only to provide suggestions for Postgres and Snowflake connections:
  const isSnowflakeConnection = editorData.connection_type === DatabaseConnectionType.Snowflake;
  const isPostgresConnection = editorData.connection_type === DatabaseConnectionType.Postgres;

  if (!(isPostgresConnection || isSnowflakeConnection)) {
    console.warn(
      "Server autocomplete is only available for Postgres and Snowflake database connections.",
    );

    return;
  }

  const isEditorFocused = monacoEditor.hasTextFocus();

  if (!isEditorFocused) return;

  const position = monacoEditor.getPosition();
  const model = monacoEditor.getModel();

  if (!(model && position)) {
    console.error("Model/position is not defined!");

    return;
  }

  const cursorLinearPosition = model.getOffsetAt(position);
  const word = model.getWordUntilPosition(position);
  const allString = model.getValue();
  const firstPart = allString.slice(0, cursorLinearPosition);

  const range: IRange = {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };

  const lastPart = allString.slice(cursorLinearPosition);
  const allStringWithCursorPointer = `${firstPart}${CURSOR_POINTER}${lastPart}`;

  editorData.websocketRoundwayTripStartTime = performance.now();
  editorData.sql = allStringWithCursorPointer;
  editorData.range = range;

  sendWebsocketAutocompleteRequest({
    monacoEditorInfo: editorData,
    websocketStore,
    modelId,
  });
}

function sendWebsocketAutocompleteRequest({
  monacoEditorInfo,
  websocketStore,
  modelId,
}: {
  websocketStore: WebsocketContextType;
  monacoEditorInfo: MonacoEditorInfo;
  modelId: string;
}) {
  if (!monacoEditorInfo.project_id) return;

  const isDataValid = validateMsgData(monacoEditorInfo);

  if (!isDataValid) return;
  const request_id = createRequestId();

  const messagePayload: ExtraDataForEachMessage & WebSocketAutocompletePayload = {
    message_type: WebsocketAction.SqlAutocomplete,
    request_id,
    message_payload: {
      connection_type: monacoEditorInfo.connection_type,
      connection_id: monacoEditorInfo.connection_id,
      block_uuid: monacoEditorInfo.block_uuid,
      project_id: monacoEditorInfo.project_id,
      sql: monacoEditorInfo.sql,
      editor_model_id: modelId,
    },
  };

  sendWebSocketMessage(websocketStore.actorRef.getSnapshot().context, messagePayload);

  console.log(
    "%cSent message to websocket to trigger autocomplete:",
    "background-color: darkgreen; color: lightgray; padding: 2px 10px;",
  );
}

function validateMsgData(
  monacoEditorInfo: MonacoEditorInfo | undefined,
): monacoEditorInfo is MonacoEditorInfo {
  let isValid = true;

  if (!monacoEditorInfo) {
    console.error("No monacoEditorInfo provided!");

    return false;
  }

  if (!monacoEditorInfo.sql) {
    console.error("No sql provided!");

    isValid = false;
  }

  if (!monacoEditorInfo.block_uuid) {
    console.error("No block_uuid provided!");

    isValid = false;
  }

  if (!isValidNumber(monacoEditorInfo.connection_id)) {
    console.error("No connection_id provided!");

    isValid = false;
  }

  if (!monacoEditorInfo.connection_type) {
    console.error("No connection_type provided!");

    isValid = false;
  }

  if (!isValidNumber(monacoEditorInfo.project_id)) {
    console.error("No project_id provided!");

    isValid = false;
  }

  return isValid;
}
