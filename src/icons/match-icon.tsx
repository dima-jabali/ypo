import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Briefcase,
  Cable,
  CalculatorIcon,
  Check,
  ChevronLeft,
  Clipboard,
  Clock8,
  Columns3,
  Copy,
  Database,
  File,
  FileJson,
  FileText,
  Folder,
  FolderSearch,
  Funnel,
  GitFork,
  Globe,
  HatGlasses,
  Image,
  ImageIcon,
  List,
  Menu,
  MessageSquareText,
  MessagesSquare,
  Minus,
  NotebookPen,
  Plus,
  Presentation,
  Redo,
  Square,
  SquareArrowOutUpRight,
  TextSearch,
  ToggleRight,
  Trash,
  Underline,
  Undo,
  X,
} from "lucide-react";

import { Loader } from "#/components/Loader";
import { IconType } from "#/features/schema-tree/helpers/types";
import { classNames } from "#/helpers/class-names";
import { MimeType } from "#/hooks/fetch/use-fetch-file-by-id";
import { BatchTableMetadataColumnType, FormattingOptions } from "#/types/batch-table";
import { BotSourceType } from "#/types/bot-source";
import { SourceForUserType } from "#/types/chat";
import { ClickUpEntityType, DatabaseConnectionType } from "#/types/databases";
import { ChatTools, GeneralFileType } from "#/types/notebook";
import { AirtableIcon } from "./airtable-icon";
import { ClickUpIcon } from "./click-up-icon";
import { CsvIcon } from "./csv-icon";
import { DocxIcon } from "./docx-icon";
import { ExcelIcon } from "./excel-icon";
import { FieldIcon } from "./field-icon";
import { GoogleDriveLogoIcon } from "./google-drive-logo-icon";
import { MetabaseIcon } from "./metabase-icon";
import { PdfIcon } from "./pdf-icon";
import { PostgresDarkIcon } from "./postgres-dark-icon";
import { PptxIcon } from "./pptx-icon";
import { SlackIcon } from "./slack-icon";
import { SnowflakeIcon } from "./snowflake-icon";

const DEFAULT_CLASSNAME = "size-4 flex-none stroke-primary stroke-1 fill-primary";

export function matchIcon(name: string | undefined | null, className?: string | undefined) {
  if (typeof name === "string" && name.startsWith("image/")) {
    return <Image className="size-5 flex-none" />;
  }

  switch (name) {
    case ChatTools.ANSWER_QUESTION_BY_SEARCHING_ORGANIZATION_CONTEXT:
      return (
        <FolderSearch
          className={classNames(
            DEFAULT_CLASSNAME,
            "fill-none stroke-1.5 group-hover:stroke-accent-foreground",
            className,
          )}
        />
      );

    case ChatTools.WAIT_FOR_HUMAN_MESSAGE:
      return (
        <Clock8
          className={classNames(
            DEFAULT_CLASSNAME,
            "fill-none stroke-1.5 group-hover:stroke-accent-foreground",
            className,
          )}
        />
      );

    case ChatTools.ANSWER_QUESTION_USING_INTERNAL_AND_EXTERNAL_SEARCH:
      return (
        <Cable
          className={classNames(
            DEFAULT_CLASSNAME,
            "fill-none stroke-1.5 group-hover:stroke-accent-foreground",
            className,
          )}
        />
      );

    case ChatTools.ANSWER_QUESTION_USING_WEB_SEARCH:
      return (
        <Globe
          className={classNames(
            DEFAULT_CLASSNAME,
            "fill-none stroke-1.5 group-hover:stroke-accent-foreground",
            className,
          )}
        />
      );

    case ChatTools.ANSWER_QUESTION_USING_CONTEXT:
      return (
        <TextSearch
          className={classNames(
            DEFAULT_CLASSNAME,
            "fill-none stroke-1.5 group-hover:stroke-accent-foreground",
            className,
          )}
        />
      );

    case ChatTools.RETURN_NORMAL_TEXT_RESPONSE:
      return (
        <MessageSquareText
          className={classNames(
            DEFAULT_CLASSNAME,
            "fill-none stroke-1.5 group-hover:stroke-accent-foreground",
            className,
          )}
        />
      );

    case ChatTools.PERFORM_ACTION_IN_NOTEBOOK:
      return (
        <NotebookPen
          className={classNames(
            DEFAULT_CLASSNAME,
            "fill-none stroke-1.5 group-hover:stroke-accent-foreground",
            className,
          )}
        />
      );

    case ChatTools.ASK_CLARIFYING_QUESTION:
      return (
        <HatGlasses
          className={classNames(
            DEFAULT_CLASSNAME,
            "fill-none stroke-1.5 group-hover:stroke-accent-foreground",
            className,
          )}
        />
      );

    case ChatTools.PLANNER:
      return (
        <Presentation
          className={classNames(
            DEFAULT_CLASSNAME,
            "fill-none stroke-1.5 group-hover:stroke-accent-foreground",
            className,
          )}
        />
      );

    case BatchTableMetadataColumnType.JSON:
      return (
        <FileJson
          className={classNames(DEFAULT_CLASSNAME, className, "fill-none")}
          strokeWidth={1.5}
        />
      );

    case BatchTableMetadataColumnType.LONG_TEXT:
      return <Menu className={classNames(DEFAULT_CLASSNAME, className, "fill-none")} />;

    case BatchTableMetadataColumnType.BOOLEAN:
      return <ToggleRight className={classNames(DEFAULT_CLASSNAME, className, "fill-none")} />;

    case BatchTableMetadataColumnType.NUMBER:
      return <CalculatorIcon className={classNames(DEFAULT_CLASSNAME, className, "fill-none")} />;

    case "trash":
      return <Trash className={classNames(DEFAULT_CLASSNAME, className, "fill-none")} />;

    case BatchTableMetadataColumnType.SINGLE_LINE_TEXT:
      return <Underline className={classNames(DEFAULT_CLASSNAME, className, "fill-none")} />;

    case "undo": {
      return <Undo className={classNames(DEFAULT_CLASSNAME, className)} />;
    }

    case "x":
      return <X className={classNames(DEFAULT_CLASSNAME, className)} />;

    case "redo": {
      return <Redo className={classNames(DEFAULT_CLASSNAME, className)} />;
    }

    case "paste": {
      return <Clipboard className={classNames(DEFAULT_CLASSNAME, className)} />;
    }

    case "+": {
      return <Plus className={classNames(DEFAULT_CLASSNAME, className)} />;
    }

    case "-": {
      return <Minus className={classNames(DEFAULT_CLASSNAME, className)} />;
    }

    case "check":
      return <Check className={classNames(DEFAULT_CLASSNAME, className)} />;

    case "filter":
      return <Funnel className={classNames(DEFAULT_CLASSNAME, className)} />;

    case "copy":
      return <Copy className={classNames(DEFAULT_CLASSNAME, className)} />;

    case FormattingOptions.TextAlignLeft: {
      return <AlignLeft className={classNames(DEFAULT_CLASSNAME, className)} />;
    }

    case FormattingOptions.TextAlignCenter: {
      return <AlignCenter className={classNames(DEFAULT_CLASSNAME, className)} />;
    }

    case FormattingOptions.TextAlignRight: {
      return <AlignRight className={classNames(DEFAULT_CLASSNAME, className)} />;
    }

    case BatchTableMetadataColumnType.FILE:
    case GeneralFileType.GENERAL:
    case MimeType.General:
    case "doc":
      return <File className={classNames(DEFAULT_CLASSNAME, className, "fill-none")} />;

    case GeneralFileType.CSV:
    case "text/csv":
    case "csv":
      return <CsvIcon className={classNames(DEFAULT_CLASSNAME, className)} />;

    case GeneralFileType.IMAGE:
    case "image":
    case GeneralFileType.JPEG:
    case "jpeg":
    case GeneralFileType.TIFF:
    case "tiff":
    case GeneralFileType.HEIF:
    case "heif":
    case GeneralFileType.HEIC:
    case "heic":
    case GeneralFileType.PNG:
    case "png":
      return <ImageIcon className={classNames(DEFAULT_CLASSNAME, "fill-none", className)} />;

    case GeneralFileType.XLSX:
    case "xlsx":
      return <ExcelIcon className={classNames(DEFAULT_CLASSNAME, className)} />;

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case GeneralFileType.DOCX:
    case "application/msword":
    case "docx":
      return <DocxIcon className={classNames(DEFAULT_CLASSNAME, className)} />;

    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.ms-powerpoint":
    case GeneralFileType.PPTX:
    case "pptx":
      return <PptxIcon className={classNames(DEFAULT_CLASSNAME, className)} />;

    case SourceForUserType.Pdf:
    case GeneralFileType.PDF:
    case "application/pdf":
    case "pdf":
      return <PdfIcon className={classNames("size-4 flex-none fill-destructive", className)} />;

    case "new-tab":
      return <SquareArrowOutUpRight className={classNames(DEFAULT_CLASSNAME, className)} />;

    case "back":
      return <ChevronLeft className={classNames(DEFAULT_CLASSNAME, className)} />;

    case BotSourceType.PDF:
      return <PdfIcon className={classNames(DEFAULT_CLASSNAME, "fill-destructive", className)} />;

    case BotSourceType.CSV:
      return <CsvIcon className={classNames("size-10", className)} />;

    case ClickUpEntityType.Workspace:
      return <Briefcase className={classNames(DEFAULT_CLASSNAME, "fill-none", className)} />;

    case ClickUpEntityType.ChatView:
      return <MessagesSquare className={classNames(DEFAULT_CLASSNAME, "fill-none", className)} />;

    case GeneralFileType.GOOGLE_DRIVE_FOLDER:
    case IconType.DATABASES_FOLDER:
    case ClickUpEntityType.Folder:
    case IconType.SCHEMAS_FOLDER:
    case GeneralFileType.FOLDER:
    case IconType.TABLES_FOLDER:
      return <Folder className={classNames(DEFAULT_CLASSNAME, "fill-none", className)} />;

    case ClickUpEntityType.List:
      return <List className={classNames(DEFAULT_CLASSNAME, "fill-none", className)} />;

    case ClickUpEntityType.Space:
      return <Square className={classNames(DEFAULT_CLASSNAME, "fill-none", className)} />;

    case SourceForUserType.Website:
    case SourceForUserType.Web:
    case BotSourceType.Web:
    case "web":
      return <Globe className={classNames(DEFAULT_CLASSNAME, "fill-none", className)} />;

    case "loader":
      return <Loader className={classNames(DEFAULT_CLASSNAME, "border-t-primary", className)} />;

    case DatabaseConnectionType.Postgres:
    case SourceForUserType.SqlQuery:
    case IconType.POSTGRESQL:
      return (
        <PostgresDarkIcon className={classNames(DEFAULT_CLASSNAME, "stroke-none", className)} />
      );

    case DatabaseConnectionType.Snowflake:
    case IconType.SNOWFLAKE:
      return <SnowflakeIcon className={classNames(DEFAULT_CLASSNAME, "stroke-none", className)} />;

    case SourceForUserType.DataSchema: {
      return <Columns3 className={classNames(DEFAULT_CLASSNAME, "fill-none", className)} />;
    }

    case SourceForUserType.Affinity: {
      return (
        <img
          alt="Affinity, the relationship intelligence platform for dealmakers"
          className={classNames(DEFAULT_CLASSNAME, "stroke-none", className)}
          src="/logos/affinity-logo.png"
          height={38}
          width={38}
        />
      );
    }

    case DatabaseConnectionType.ExternalDatasource:
    case IconType.EXTERNAL:
      return <Database className={classNames(DEFAULT_CLASSNAME, className)} />;

    case IconType.TABLE:
      return <Columns3 className={classNames(DEFAULT_CLASSNAME, "fill-none", className)} />;

    case IconType.SCHEMA:
      return <GitFork className={classNames(DEFAULT_CLASSNAME, "fill-none", className)} />;

    case IconType.DATABASE:
      return (
        <Database
          className={classNames(DEFAULT_CLASSNAME, "fill-yellow-400 stroke-gray-700", className)}
        />
      );

    case IconType.METABASE:
      return <MetabaseIcon className={classNames(DEFAULT_CLASSNAME, className)} />;

    case DatabaseConnectionType.OracleDatabase:
    case IconType.ORACLE:
      return <span className={classNames(DEFAULT_CLASSNAME, "-m-0.5 h-4 w-0", className)} />;

    case IconType.FIELD:
      return <FieldIcon className={classNames(DEFAULT_CLASSNAME, className)} />;

    case DatabaseConnectionType.Slack:
    case SourceForUserType.Slack:
    case BotSourceType.Slack:
    case IconType.SLACK:
      return <SlackIcon className={classNames(DEFAULT_CLASSNAME, "stroke-none", className)} />;

    case DatabaseConnectionType.Airtable:
    case SourceForUserType.Airtable:
    case IconType.AIRTABLE:
      return <AirtableIcon className={classNames(DEFAULT_CLASSNAME, "stroke-none", className)} />;

    case DatabaseConnectionType.GoogleDrive:
    case SourceForUserType.GoogleDrive:
    case IconType.GOOGLE_DRIVE:
      return (
        <GoogleDriveLogoIcon className={classNames(DEFAULT_CLASSNAME, "stroke-none", className)} />
      );

    case SourceForUserType.StandardDocument: {
      return <FileText className={classNames(DEFAULT_CLASSNAME, "fill-none", className)} />;
    }

    case DatabaseConnectionType.ClickUp:
      return <ClickUpIcon className={classNames(DEFAULT_CLASSNAME, "stroke-none", className)} />;

    case SourceForUserType.ModeDefinition:
    case SourceForUserType.ModeQuery: {
      return (
        <img
          className={classNames(DEFAULT_CLASSNAME, "stroke-none", className)}
          alt="Green capital letter 'm'"
          src="/logos/mode-query.png"
        />
      );
    }

    case IconType.NONE:
    default:
      console.log("No icon:", name);

      return <span className={classNames(DEFAULT_CLASSNAME, "-m-0.5 h-4 w-0", className)} />;
  }
}
