import {
	type BlockCsv,
	type BlockImage,
	type BlockPDF,
	type BlockPython,
	type BlockSql,
	type BlockTable,
	type BlockText,
	BlockType,
	type NotebookBlock,
} from "#/types/notebook";
import { CSVBlock } from "../Blocks/csv-block";
import { ImageBlock } from "../Blocks/image-block";
import { PdfBlock } from "../Blocks/pdf-block";
import { PythonBlock } from "../Blocks/python-block";
import { SqlBlock } from "../Blocks/sql-block";
import { DefaultSuspenseAndErrorBoundary } from "../fallback-loader";
import { TextBlock } from "../Blocks/text-block";
import { TableBlock } from "../Blocks/table-block";

export function renderNotebookBlock(notebookBlock: NotebookBlock) {
	let node = null;

	switch (notebookBlock.type) {
		case BlockType.Pdf: {
			node = <PdfBlock pdfBlock={notebookBlock as BlockPDF} />;
			break;
		}

		case BlockType.Image: {
			node = <ImageBlock imageBlock={notebookBlock as BlockImage} />;
			break;
		}

		case BlockType.Sql: {
			node = <SqlBlock sqlBlock={notebookBlock as BlockSql} />;
			break;
		}

		case BlockType.Python: {
			node = <PythonBlock pythonBlock={notebookBlock as BlockPython} />;
			break;
		}

		case BlockType.Csv: {
			node = <CSVBlock csvBlock={notebookBlock as BlockCsv} />;
			break;
		}

		case BlockType.Text: {
			node = <TextBlock textBlock={notebookBlock as BlockText} />;
			break;
		}

		case BlockType.Table: {
			node = <TableBlock tableBlock={notebookBlock as BlockTable} />;
			break;
		}

		default: {
			console.log(
				"Can't render this notebook block type:",
				notebookBlock.type,
				{ notebookBlock },
			);

			break;
		}
	}

	if (node === null) return null;

	return (
		<DefaultSuspenseAndErrorBoundary
			failedText="Error rendering notebook block"
			fallbackFor="RenderNotebookBlock"
			key={notebookBlock.uuid}
		>
			{node}
		</DefaultSuspenseAndErrorBoundary>
	);
}
