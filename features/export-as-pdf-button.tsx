import { ArrowUpFromLine } from "lucide-react";
import { memo, useState } from "react";

import { Loader } from "#/components/Loader";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import {
	CHAT_MESSAGE_LIST_HTML_ELEMENT_ID,
	getErrorMessage,
	isValidNumber,
	sleep,
} from "#/helpers/utils";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

export const ExportAsPdfButton: React.FC = memo(function ExportAsPdfButton() {
	const [isExporting, setIsExporting] = useState(false);

	function getProjectName() {
		const { getNotebook, notebookId } = generalContextStore.getState();

		if (!isValidNumber(notebookId)) {
			throw new Error("Notebook id is not defined!");
		}

		const title = getNotebook(notebookId)?.metadata.title;

		if (!title) {
			throw new Error("Notebook title is not defined!");
		}

		return title;
	}

	async function handleExportChatAsPdf() {
		if (isExporting) return;

		const element = document.getElementById(CHAT_MESSAGE_LIST_HTML_ELEMENT_ID);

		if (!element) {
			console.error("Scroll ref is not defined");

			return;
		}

		const scrollHeight = element.scrollHeight;

		setIsExporting(true);

		try {
			await printHtmlElement(document.body, scrollHeight);
		} catch (error) {
			const msg = "Error exporting chat as PDF!";

			console.error(msg, error);

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: msg,
			});
		} finally {
			setIsExporting(false);
		}
	}

	async function handleExportChatAsPng() {
		if (isExporting) return;

		const element = document.getElementById(CHAT_MESSAGE_LIST_HTML_ELEMENT_ID);

		if (!element) {
			console.error("Scroll ref is not defined");

			return;
		}

		setIsExporting(true);

		try {
			const { toPng } = await import("html-to-image");

			const scrollHeight = element.scrollHeight;
			const main = document.body.querySelector("main")!;

			const backgroundColor =
				getComputedStyle(main).getPropertyValue("background-color");

			await replaceBlobImages(main);

			const pngDataUrl = await toPng(element, {
				height: scrollHeight + 120,
				includeQueryParams: false,
				cacheBust: false,
				backgroundColor,
				onImageErrorHandler(event, source, lineno, colno, error) {
					console.log("Failed to download image:", {
						event,
						source,
						lineno,
						colno,
						error,
					});
				},
			});

			const link = document.createElement("a");
			link.download = `${getProjectName()}.png`;
			link.href = pngDataUrl;
			link.click();
		} catch (error) {
			const msg = "Error exporting chat as PNG image!";

			console.error(msg, error);

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: msg,
			});
		} finally {
			setIsExporting(false);
		}
	}

	return (
		<Popover>
			<PopoverTrigger
				className="button-hover text-primary px-1.5 flex items-center rounded-sm text-xs gap-1.5 h-full"
				data-no-print
			>
				{isExporting ? (
					<Loader className="size-3 border-t-primary" />
				) : (
					<ArrowUpFromLine className="size-3 fill-primary" />
				)}

				<span>
					Export{isExporting ? "ing" : ""} chat{isExporting ? "..." : ""}
				</span>
			</PopoverTrigger>

			<PopoverContent
				className="gap-1 flex flex-col max-w-[190px] text-primary"
				align="start"
				data-no-print
			>
				<button
					className="button-hover p-2 flex items-start rounded-sm text-sm gap-1.5 h-full flex-col justify-start"
					onClick={handleExportChatAsPng}
					disabled={isExporting}
				>
					<p>Export as PNG image</p>

					<span className="text-xs text-muted">Text is not selectable</span>
				</button>

				<button
					className="button-hover p-2 flex items-start rounded-sm text-sm gap-1.5 h-full flex-col justify-start"
					onClick={handleExportChatAsPdf}
					disabled={isExporting}
				>
					<p>Export as PDF file</p>

					<p className="text-xs text-muted text-left">
						Text is selectable but not everything may render correctly
					</p>
				</button>
			</PopoverContent>
		</Popover>
	);
});

async function printHtmlElement(
	contentToPrint: HTMLElement,
	scrollHeight: number,
) {
	if (!contentToPrint) return;

	if (!isValidNumber(scrollHeight)) {
		console.log({ scrollHeight });

		throw new Error("Scroll height is invalid!");
	}

	// Force to be async:
	await sleep(0);

	// Clone the HTML structure to maintain selectable text
	const contentClone = contentToPrint.cloneNode(true) as HTMLElement;

	// Create a hidden iframe for printing
	const iframe = document.createElement("iframe");
	iframe.style.position = "absolute";
	iframe.style.top = "-9999px";

	iframe.onerror = (event) => {
		console.error("Failed to print HTML:", { event });
	};

	document.body.appendChild(iframe);

	const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
	if (!iframeDoc) return;

	// Copy styles from the main document
	const styles = Array.from(document.styleSheets)
		.map((sheet) => {
			try {
				return Array.from(sheet.cssRules)
					.map((rule) => {
						if (rule instanceof CSSKeyframesRule) {
							return "";
						}

						if (
							rule instanceof CSSStyleRule &&
							rule.selectorText.startsWith(".cl-") /* Clerk, ignore */
						) {
							return "";
						}

						return rule.cssText;
					})
					.join("");
			} catch (error) {
				console.log("[IGNORED ERROR] Failed to copy styles from sheet:", {
					sheet,
					error,
				});

				return ""; // Skip inaccessible sheets (e.g., cross-origin)
			}
		})
		.join("");

	const total = contentClone.childNodes.length - 1;
	for (let i = total; i >= 0; i--) {
		const child = contentClone.childNodes[i];

		if (!child) continue;

		if (!("id" in child) || child.id !== "app") {
			contentClone.removeChild(child);
		}
	}

	const html = `\
<!DOCTYPE html>
<html data-color-scheme="${generalContextStore.getState().colorScheme}">
	<head>
		<style>
			${styles}

			@page {
				size: 930px ${scrollHeight + 600}px;
			}

			[data-no-print] {
				display: none !important;
			}
		</style>
	</head>

	${contentClone.innerHTML}
</html>
`;

	// const parser = new DOMParser();
	// // Parse the full HTML string into a temporary DOM document
	// const cleanDoc = parser.parseFromString(html, "text/html");
	// cleanDoc.querySelectorAll("script").forEach((script) => script.remove());
	// // 4. Serialize the cleaned DOM tree back into a string
	// const serializer = new XMLSerializer();
	// const cleanedHtml = serializer.serializeToString(cleanDoc);

	iframeDoc.open();
	iframeDoc.write(html);
	iframeDoc.close();

	// Wait for everything to load before printing
	iframe.onload = () => {
		console.log("Loaded print iframe");

		const printWindow = iframe.contentWindow;

		if (!printWindow) {
			console.log("Failed to get iframe content window and print it!");

			return;
		}

		printWindow.focus();
		printWindow.print();

		// Clean up the iframe after printing
		document.body.removeChild(iframe);
	};
}

async function convertBlobToDataUrl(blobUrl: string): Promise<string> {
	const blob = await fetch(blobUrl).then((res) => res.blob());

	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.readAsDataURL(blob);
	});
}

async function replaceBlobImages(rootElement: HTMLElement) {
	const imgElements = rootElement.querySelectorAll("img");

	for (const img of imgElements) {
		if (img.src.startsWith("blob:")) {
			img.src = await convertBlobToDataUrl(img.src);
		}
	}
}
