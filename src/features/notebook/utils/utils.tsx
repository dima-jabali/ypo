import { QuoteIcon } from "lucide-react";

import { CsvIcon } from "#/icons/csv-icon";
import {
	H1Icon,
	H2Icon,
	H3Icon,
	H4Icon,
	H5Icon,
	H6Icon,
} from "#/icons/headings";
import { ParagraphIcon } from "#/icons/paragraph-icon";
import { PdfIcon } from "#/icons/pdf-icon";
import { PostgresDarkIcon } from "#/icons/postgres-dark-icon";
import { PythonIcon } from "#/icons/python-icon";
import { BlockLabel, BlockType } from "#/types/notebook";
import type { FilterResult } from "../components/slash-plugin/ctx";

export const COMMAND_POPOVER_STYLE_VARS = {
	"--auto-grid-min-size": "9.5rem",
	"--auto-grid-max-columns": 4,
	"--auto-grid-gap": "1rem",
} as React.CSSProperties;

export const DEFAULT_FILTER_RESULTS: Array<FilterResult> = [
	// {
	// 	icon: <ChatBubbleLeftRightIcon className="size-5 flex-none" />,
	// 	blockType: "message-input",
	// 	title: "Chat",
	// },
	// {
	// 	blockType: BlockType.BatchTable,
	// 	title: "Sapien table",
	// 	icon: <TableCellsIcon className="size-5" />,
	// },
	// {
	// 	icon: <Table className="size-5 text-warning" />,
	// 	subtype: BlockLabel.TABLE_BLOCK,
	// 	blockType: BlockType.Table,
	// 	title: "Table",
	// },
	{
		icon: <PostgresDarkIcon className="size-5" />,
		subtype: BlockLabel.SQLE,
		blockType: BlockType.Sql,
		title: "SQL",
	},
	{
		subtype: BlockLabel.CSV,
		blockType: BlockType.Csv,
		icon: <CsvIcon className="size-5" />,
		title: "CSV",
	},
	{
		icon: <QuoteIcon className="size-5 fill-primary" />,
		subtype: BlockLabel.BLOCKQUOTE,
		blockType: BlockType.Text,
		title: "Block quote",
	},
	{
		blockType: BlockType.Python,
		icon: <PythonIcon className="size-5" />,
		subtype: BlockLabel.PYTHON,
		title: "Python",
	},
	{
		icon: <PdfIcon className="size-5 fill-destructive" />,
		blockType: BlockType.Pdf,
		subtype: BlockLabel.PDF,
		title: "PDF",
	},
	{
		icon: <ParagraphIcon className="size-5 fill-primary" />,
		subtype: BlockLabel.PARAGRAPH,
		blockType: BlockType.Text,
		title: "Paragraph",
	},
	{
		subtype: BlockLabel.H1,
		blockType: BlockType.Text,
		icon: <H1Icon className="size-5" />,
		title: "H1 heading",
	},
	{
		subtype: BlockLabel.H2,
		blockType: BlockType.Text,
		icon: <H2Icon className="size-5" />,
		title: "H2 heading",
	},
	{
		subtype: BlockLabel.H3,
		blockType: BlockType.Text,
		icon: <H3Icon className="size-5" />,
		title: "H3 heading",
	},
	{
		subtype: BlockLabel.H4,
		blockType: BlockType.Text,
		icon: <H4Icon className="size-5" />,
		title: "H4 heading",
	},
	{
		subtype: BlockLabel.H5,
		blockType: BlockType.Text,
		icon: <H5Icon className="size-5" />,
		title: "H5 heading",
	},
	{
		subtype: BlockLabel.H6,
		blockType: BlockType.Text,
		icon: <H6Icon className="size-5" />,
		title: "H6 heading",
	},
] as const;
