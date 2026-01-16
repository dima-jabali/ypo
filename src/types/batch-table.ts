import type { EmptyObject, Tagged } from "type-fest";

import type { FilterOperator } from "#/components/Tables/TableMaker/filters/utilityTypes";
import type { BatchTableId, ISODateString, Nullable } from "./general";
import type { BetterbrainUser } from "./notebook";
import type { Organization } from "#/hooks/fetch/use-fetch-all-organizations";

export type CellCoords = `${BatchTableRowIndex}-${BatchTableColumnIndex}`;
export type BatchTableToolConfigurationId = Tagged<number, "BatchTableToolConfigurationId">;
export type BatchTableToolSettingsId = Tagged<number, "BatchTableToolSettingsId">;
export type BatchTableColumnIndex = Tagged<number, "BatchTableColumnIndex">;
export type BatchTableColumnUuid = Tagged<string, "BatchTableColumnUuid">;
export type BatchTableCellUuid = Tagged<string, "BatchTableCellUuid">;
export type BatchTableColumnId = Tagged<number, "BatchTableColumnId">;
export type BatchTableRowIndex = Tagged<number, "BatchTableRowIndex">;
export type BatchTableRowUuid = Tagged<string, "BatchTableRowUuid">;
export type BatchTableCellId = Tagged<number, "BatchTableCellId">;
export type BatchTableRowId = Tagged<number, "BatchTableRowId">;
export type BatchTableToolId = Tagged<number, "BatchTableToolId">;

type SingleLineTextInfo = Readonly<EmptyObject>;

type FileColumnType = Readonly<EmptyObject>;

type LongTextInfo = Readonly<EmptyObject>;

type NumberInfo = Readonly<{
  is_integer: boolean;
}>;

type BatchTableMetadataColumnTypeSpecificInfo =
  | SingleLineTextInfo
  | FileColumnType
  | LongTextInfo
  | NumberInfo;

export enum DerivationType {
  JSON_COLUMN_DATA = "JSON_COLUMN_DATA",
  TOOL_OUTPUTS = "TOOL_OUTPUTS",
}

export type BatchTableColumnChildFilter = {
  value_operator: any;
  column_id: BatchTableColumnId | undefined;
  caseSensitive: boolean;
  value: unknown;
};

export enum BatchTableMetadataColumnType {
  SINGLE_LINE_TEXT = "SINGLE_LINE_TEXT",
  LONG_TEXT = "LONG_TEXT",
  BOOLEAN = "BOOLEAN",
  NUMBER = "NUMBER",
  FILE = "FILE",
  JSON = "JSON",
}

export const BATCH_TABLE_METADATA_COLUMN_TYPE_OPTIONS = Object.values(BatchTableMetadataColumnType);

export type BatchTableConditionalExecutionFilterGroup = {
  children: Array<BatchTableColumnChildFilter | BatchTableConditionalExecutionFilterGroup>;
  filter_operator: FilterOperator;
};

export type BatchTableColumn = Nullable<{
  derived_from_column: {
    uuid: BatchTableColumnUuid;
    id: BatchTableColumnId;
  };
  column_type_specific_info: BatchTableMetadataColumnTypeSpecificInfo;
  execution_condition: BatchTableConditionalExecutionFilterGroup;
  column_type: BatchTableMetadataColumnType;
  tool_settings: BatchTableToolSettings;
  last_modified_by: BetterbrainUser;
  derivation_type: DerivationType;
  derivation_path: Array<string>;
  created_by: BetterbrainUser;
  updated_at: ISODateString;
  created_at: ISODateString;
  default_value: unknown;
  is_derived: boolean;
  description: string;
  use_ai: boolean;
  prompt: string;
  name: string;
}> & {
  column_format: {
    isVisible: boolean;
    width: number;
  };
  column_index: BatchTableColumnIndex;
  uuid: BatchTableColumnUuid;
  id: BatchTableColumnId;
};

export enum BatchTableCellFormatPattern {
  DateAndTime = "Date and Time",
  Financial = "Financial",
  Duration = "Duration",
  Percent = "Percent",
  Number = "Number",
  Date = "Date",
  Time = "Time",
  Text = "Text",
  None = "None",
}

export enum FormattingOptions {
  Strikethrough = "strikethrough",
  TextAlignCenter = "center",
  TextAlignRight = "right",
  Underline = "underline",
  TextAlignLeft = "left",
  Italic = "italic",
  Bold = "bold",
}

export type BatchTableCellFormat = Nullable<{
  textAlign?:
    | typeof FormattingOptions.TextAlignLeft
    | typeof FormattingOptions.TextAlignCenter
    | typeof FormattingOptions.TextAlignRight;
  fontStyle?: "bold" | "normal" | "italic" | "bold italic";
  verticalAlign?: "top" | "middle" | "bottom";
  pattern?: BatchTableCellFormatPattern;
  strikethrough?: true;
  textColor?: string;
  fontSize?: number;
  bgColor?: string;
  underline?: true;
}>;

export enum AIFillStatus {
  NotStarted = "NOT_STARTED",
  InProgress = "IN_PROGRESS",
  TimedOut = "TIMED_OUT",
  Complete = "COMPLETE",
  Aborted = "ABORTED",
  Failed = "FAILED",
}

export type BatchTableCell = {
  column: {
    id?: BatchTableColumnId;
    column_index: BatchTableColumnIndex;
    uuid?: BatchTableColumnUuid;
  };
  row: {
    id?: BatchTableRowId;
    row_index: BatchTableRowIndex;
    uuid?: BatchTableRowUuid;
  };
  results_cache: Record<string, unknown> | null | undefined;
  ai_fill_status_last_changed_at: ISODateString | null;
  sources: Array<BatchTableSource> | null | undefined;
  format: BatchTableCellFormat | null | undefined;
  tool_outputs?: Record<string, unknown> | null;
  ai_last_attempt_at: ISODateString | null;
  formula: string | null | undefined;
  last_modified_by: BetterbrainUser;
  ai_fill_status: AIFillStatus;
  updated_at: ISODateString;
  created_at: ISODateString;
  value_text: string | null;
  ai_able_to_fill: boolean;
  value: unknown;
  uuid: BatchTableCellUuid;
  id: BatchTableCellId;
};

export enum BatchTableSourceType {
  InternalContext = "INTERNAL_CONTEXT",
  Website = "WEBSITE",
  Column = "COLUMN",
}

export type BatchTableRow = {
  last_modified_by: BetterbrainUser;
  updated_at: ISODateString | null;
  created_at: ISODateString | null;
  created_by: BetterbrainUser;
  row_index: BatchTableRowIndex;
  uuid: BatchTableRowUuid;
  id: BatchTableRowId;
  format: {
    height: number;
  };
};

export type ToolConfiguration = Nullable<{
  /** Keys are the input names */
  inputs: Record<string, unknown>;
  last_modified_at: ISODateString;
  created_at: ISODateString;
  updated_at: ISODateString;
}> & {
  id: BatchTableToolConfigurationId;
  tool_priority: number;
  tool: Tool;
};

enum SoftwareTools {
  GoogleDrive = "GOOGLE_DRIVE",
}

export type GeneralToolInput = {
  type: "boolean" | "array<string>" | "string" | "integer";
  can_be_inferred: boolean;
  /** String or array or integer or number or boolean or object: */
  default_value: unknown;
  is_required: boolean;
  has_default: boolean;
  description: string;
  name: string;
};

export type Tool = {
  depends_on_software_tools: Array<SoftwareTools>;
  // can_be_used_with_entity_column: boolean; // Entity column is not used anymore
  is_available_in_batch_table: boolean;
  metadata: Record<string, unknown>;
  outputs: Record<string, unknown>;
  inputs: Array<GeneralToolInput>;
  last_modified_at: ISODateString;
  updated_at: ISODateString;
  created_at: ISODateString;
  description: string;
  user_name: string;
  name: string;
  id: BatchTableToolId;
};

export enum BatchTableToolSettingsInheritanceType {
  INHERIT = "INHERIT",
  CUSTOM = "CUSTOM",
}

export type BatchTableToolSettings = Nullable<{
  inheritance_type: BatchTableToolSettingsInheritanceType;
  tool_configurations: Array<ToolConfiguration>;
  source_columns: Array<BatchTableColumnId>;
  use_all_columns: boolean;
}> & {
  id: BatchTableToolSettingsId;
};

export enum BatchTableMode {
  Excel = "EXCEL",
  Table = "TABLE",
}

export type BatchTableSource = {
  type: BatchTableSourceType;
  identifier: string;
};

export type BatchTableEntitySuggestion = {
  sources: Array<BatchTableSource>;
  name: string;
};

export type BatchTable = Nullable<{
  entity_suggestions?: Array<BatchTableEntitySuggestion>;
  tool_settings: BatchTableToolSettings;
  last_modified_by: BetterbrainUser;
  batch_table_mode: BatchTableMode;
  columns: Array<BatchTableColumn>;
  // entity_column: BatchTableColumn; // Not used anymore!
  last_modified_at: ISODateString;
  cells: Array<BatchTableCell>;
  created_by: BetterbrainUser;
  rows: Array<BatchTableRow>;
  organization: Organization;
  created_at: ISODateString;
  description: string;
  archived: boolean;
  name: string;
}> & {
  id: BatchTableId;
};

export type BatchTableMetadata = BatchTable & {
  cells: never; // On metadata, the difference is the cells are an empty array
  rows: never;
};
