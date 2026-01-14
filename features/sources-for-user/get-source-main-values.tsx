import { removeSourceCitations } from "#/components/Markdown/pre-processors";
import type { SourceID } from "#/contexts/source-citation-context";
import {
	AffinitySourceType,
	DocumentType,
	GoogleDriveContentType,
	GoogleDriveSourceType,
	SourceForUserType,
	StandardDocumentContentType,
	StandardDocumentSourceType,
	type AffinityNote,
	type AffinityOrganization,
	type AffinityPerson,
	type AirtableRecord,
	type DataSchemaEntity,
	type ModeDefinitionType,
	type ModeQueryType,
	type PdfSnippet,
	type SlackConversation,
	type SQLQueryType,
	type WebsiteSnippet,
	type WebsiteSource,
} from "#/types/chat";
import { DocumentSource } from "#/types/notebook";
import type { NormalizedSource } from "./get-top-n-sources";
import { HighlightStringWithFilterRegex } from "./highlight-string-with-filter-regex";
import { Link } from "./Link";
import { AirtableDescription } from "./Snippets/Airtable";
import { DataSchemaTitleLink } from "./Snippets/data-schema";
import { ModeDefinitionTitleTrigger } from "./Snippets/mode-definition";
import { ModeQueryTitleTrigger } from "./Snippets/mode-query";
import { PdfTitlePopoverTrigger } from "./Snippets/Pdf";
import { SlackConversations } from "./Snippets/Slack";
import { SqlQueryTitleDialogTrigger } from "./Snippets/sql-query";

export type SourceMainValues<
	SourceType extends SourceForUserType,
	ValuesType extends NormalizedSource["values_type"],
> = {
	normalizedSource: Extract<
		NormalizedSource,
		{ source_type: SourceType; values_type: ValuesType }
	>;
	descriptionJSX: React.ReactNode;
	titleJSX: React.ReactNode;
	descriptionString: string;
	titleString: string;
	relevance: number;
	id: SourceID;
};

const UNKOWN = "<unknown>" as SourceID;

function makeUnkownValues(
	normalizedSource: NormalizedSource,
): SourceMainValues<SourceForUserType, NormalizedSource["values_type"]> {
	return {
		descriptionString: UNKOWN,
		descriptionJSX: null,
		titleString: UNKOWN,
		normalizedSource,
		titleJSX: null,
		relevance: NaN,
		id: UNKOWN,
	};
}

const CLICKUP_COMMENT_SUBSTRING = "CLICKUP_COMMENT_";
const CLICKUP_LINK = "https://app.clickup.com/";
const CLIKUP_TASK_LINK = `${CLICKUP_LINK}t/`;
const AFFINITY_LINK = "Affinity link";

export function getMinimalStandardDocumentValues(
	normalizedSource: Extract<
		NormalizedSource,
		{
			source_type: SourceForUserType.StandardDocument;
			values_type: StandardDocumentSourceType.Minimal;
		}
	>,
): SourceMainValues<
	SourceForUserType.StandardDocument,
	StandardDocumentSourceType.Minimal
> {
	const { values } = normalizedSource;
	const titleString = removeSourceCitations(values.fields.filename || "");
	const documentSource = values.fields.document_source;
	const documentType = values.fields.document_type;

	clickUpTask: if (
		documentType === DocumentType.ClickUpTask &&
		documentSource === DocumentSource.Clickup
	) {
		const taskId = values.fields.folder_path_ids?.at(-1)?.replace("TASK_", "");

		if (!taskId) {
			break clickUpTask;
		}

		const titleString = removeSourceCitations(values.fields.filename || "");
		const href = `${CLIKUP_TASK_LINK}${taskId}`;

		const ret: SourceMainValues<
			SourceForUserType.StandardDocument,
			StandardDocumentSourceType.Minimal
		> = {
			get titleJSX() {
				const value = <Link href={values.link ?? href} title={titleString} />;

				// 'configurable: true' is implicit in object literals, allowing this.
				Object.defineProperty(this, "titleJSX", {
					configurable: false, // Locks it down
					enumerable: true,
					writable: false, // Set to true if you want it mutable later
					value,
				});

				return value;
			},

			descriptionString: removeSourceCitations(
				values.fields.long_text_data?.join("") || "",
			),
			relevance: values.relevance,
			descriptionJSX: null,
			normalizedSource,
			id: values.id,
			titleString,
		};

		return ret;
	}

	clickUpComment: if (documentType === DocumentType.ClickUpComment) {
		const taskId = values.fields.folder_path_ids?.at(-1)?.replace("TASK_", "");

		if (!taskId) {
			break clickUpComment;
		}

		const id = values.id;
		const clickUpCommentIndex = id?.indexOf(CLICKUP_COMMENT_SUBSTRING);

		if (clickUpCommentIndex === -1) {
			break clickUpComment;
		}

		const commentId = id.slice(
			clickUpCommentIndex + CLICKUP_COMMENT_SUBSTRING.length,
		);
		const titleString = removeSourceCitations(values.fields.filename || "");
		const href = `${CLIKUP_TASK_LINK}${taskId}?comment=${commentId}`;

		const ret: SourceMainValues<
			SourceForUserType.StandardDocument,
			StandardDocumentSourceType.Minimal
		> = {
			get titleJSX() {
				const value = <Link href={values.link ?? href} title={titleString} />;

				// 'configurable: true' is implicit in object literals, allowing this.
				Object.defineProperty(this, "titleJSX", {
					configurable: false, // Locks it down
					enumerable: true,
					writable: false, // Set to true if you want it mutable later
					value,
				});

				return value;
			},

			descriptionString: removeSourceCitations(
				values.fields.long_text_data?.join("") || "",
			),
			relevance: values.relevance,
			descriptionJSX: null,
			normalizedSource,
			id: values.id,
			titleString,
		};

		return ret;
	}

	if (documentType === DocumentType.ClickUpDocument) {
		const titleString = removeSourceCitations(values.fields.filename || "");
		const teamId = values.fields.folder_path_ids
			?.find((str) => str.startsWith("WORKSPACE_"))
			?.replace("WORKSPACE_", "");
		const documentId = values.fields.folder_path_ids
			?.find(
				(str) =>
					str.startsWith("DOCUMENT_") && !str.startsWith("DOCUMENT_PAGE_"),
			)
			?.replace("DOCUMENT_", "");
		const documentPage = values.fields.folder_path_ids
			?.findLast((str) => str.startsWith("DOCUMENT_PAGE_"))
			?.replace("DOCUMENT_PAGE_", "");
		const href = `${CLICKUP_LINK}${teamId}/docs/${documentId}/${documentPage}`;

		const ret: SourceMainValues<
			SourceForUserType.StandardDocument,
			StandardDocumentSourceType.Minimal
		> = {
			get titleJSX() {
				const value = <Link href={values.link ?? href} title={titleString} />;

				// 'configurable: true' is implicit in object literals, allowing this.
				Object.defineProperty(this, "titleJSX", {
					configurable: false, // Locks it down
					enumerable: true,
					writable: false, // Set to true if you want it mutable later
					value,
				});

				return value;
			},

			descriptionString: removeSourceCitations(
				values.fields.long_text_data?.join("") || "",
			),
			relevance: values.relevance,
			descriptionJSX: null,
			normalizedSource,
			id: values.id,
			titleString,
		};

		return ret;
	}

	/* ---------- 4. Fallback (now task‑aware) ---------- */
	let hrefForTask: string | undefined = undefined;
	if (documentSource === DocumentSource.Clickup) {
		const taskIdInPath = values.fields.folder_path_ids
			?.findLast((str) => str.startsWith("TASK_"))
			?.replace("TASK_", "");

		hrefForTask = taskIdInPath
			? `${CLIKUP_TASK_LINK}${taskIdInPath}`
			: undefined;
	}

	const ret: SourceMainValues<
		SourceForUserType.StandardDocument,
		StandardDocumentSourceType.Minimal
	> = {
		descriptionString: removeSourceCitations(
			values.fields.long_text_data?.join("") || "",
		),
		relevance: values.relevance,
		descriptionJSX: null,
		normalizedSource,
		id: values.id,
		titleString,

		get titleJSX() {
			const value =
				(values.link ?? hrefForTask) ? (
					<Link href={values.link! ?? hrefForTask!} title={titleString} />
				) : (
					<p className="max-h-full break-all truncate group-data-[is-drawer]/drawer:font-bold group-data-[is-drawer]/drawer:text-base group-data-[is-drawer]/drawer:text-link">
						<HighlightStringWithFilterRegex string={titleString} />
					</p>
				);

			// 'configurable: true' is implicit in object literals, allowing this.
			Object.defineProperty(this, "titleJSX", {
				configurable: false, // Locks it down
				enumerable: true,
				writable: false, // Set to true if you want it mutable later
				value,
			});

			return value;
		},
	};

	return ret;
}

export function getVerboseStandardDocumentValues(
	normalizedSource: Extract<
		NormalizedSource,
		{
			source_type: SourceForUserType.StandardDocument;
			values_type: StandardDocumentSourceType.Verbose;
		}
	>,
): SourceMainValues<
	SourceForUserType.StandardDocument,
	StandardDocumentSourceType.Verbose
> {
	const { values } = normalizedSource;
	const descriptionString = removeSourceCitations(
		values.content_list
			?.map((item) =>
				item.type === StandardDocumentContentType.Text ? item.text : "",
			)
			.join("") || "",
	);
	const titleString = `${values.file_name ?? `${values.document_type} file`}`;
	const id = values.id || (`${Math.random()}` as SourceID);

	clickUpTask: if (
		values.document_type === DocumentType.ClickUpTask &&
		values.document_source === DocumentSource.Clickup
	) {
		const taskId = values.folder_path_ids?.at(-1)?.replace("TASK_", "");

		if (!taskId) {
			break clickUpTask;
		}

		const href = `${CLIKUP_TASK_LINK}${taskId}`;

		const ret: SourceMainValues<
			SourceForUserType.StandardDocument,
			StandardDocumentSourceType.Verbose
		> = {
			get titleJSX() {
				const value = <Link href={values.link ?? href} title={titleString} />;

				// 'configurable: true' is implicit in object literals, allowing this.
				Object.defineProperty(this, "titleJSX", {
					configurable: false, // Locks it down
					enumerable: true,
					writable: false, // Set to true if you want it mutable later
					value,
				});

				return value;
			},

			descriptionJSX: null,
			descriptionString,
			normalizedSource,
			relevance: NaN,
			titleString,
			id,
		};

		return ret;
	}

	clickUpComment: if (values.document_type === DocumentType.ClickUpComment) {
		const id = values.id;

		if (!id) {
			break clickUpComment;
		}

		const taskId = values.folder_path_ids?.at(-1)?.replace("TASK_", "");

		if (!taskId) {
			break clickUpComment;
		}

		const clickUpCommentIndex = id?.indexOf(CLICKUP_COMMENT_SUBSTRING);

		if (clickUpCommentIndex === -1) {
			break clickUpComment;
		}

		const commentId = id.slice(
			clickUpCommentIndex + CLICKUP_COMMENT_SUBSTRING.length,
		);
		const href = `${CLIKUP_TASK_LINK}${taskId}?comment=${commentId}`;

		const ret: SourceMainValues<
			SourceForUserType.StandardDocument,
			StandardDocumentSourceType.Verbose
		> = {
			get titleJSX() {
				const value = <Link href={values.link ?? href} title={titleString} />;

				// 'configurable: true' is implicit in object literals, allowing this.
				Object.defineProperty(this, "titleJSX", {
					configurable: false, // Locks it down
					enumerable: true,
					writable: false, // Set to true if you want it mutable later
					value,
				});

				return value;
			},

			descriptionJSX: null,
			descriptionString,
			normalizedSource,
			relevance: NaN,
			titleString,
			id,
		};

		return ret;
	}

	if (values.document_type === DocumentType.ClickUpDocument) {
		const teamId = values.folder_path_ids
			?.find((str) => str.startsWith("WORKSPACE_"))
			?.replace("WORKSPACE_", "");
		const documentId = values.folder_path_ids
			?.find(
				(str) =>
					str.startsWith("DOCUMENT_") && !str.startsWith("DOCUMENT_PAGE_"),
			)
			?.replace("DOCUMENT_", "");
		const documentPage = values.folder_path_ids
			?.findLast((str) => str.startsWith("DOCUMENT_PAGE_"))
			?.replace("DOCUMENT_PAGE_", "");
		const href = `${CLICKUP_LINK}${teamId}/docs/${documentId}/${documentPage}`;

		const ret: SourceMainValues<
			SourceForUserType.StandardDocument,
			StandardDocumentSourceType.Verbose
		> = {
			get titleJSX() {
				const value = <Link href={values.link ?? href} title={titleString} />;

				// 'configurable: true' is implicit in object literals, allowing this.
				Object.defineProperty(this, "titleJSX", {
					configurable: false, // Locks it down
					enumerable: true,
					writable: false, // Set to true if you want it mutable later
					value,
				});

				return value;
			},

			descriptionJSX: null,
			descriptionString,
			normalizedSource,
			relevance: NaN,
			titleString,
			id,
		};

		return ret;
	}

	/* ---------- 4. Fallback (now task‑aware) ---------- */
	let hrefForTask: string | undefined = undefined;
	if (values.document_source === DocumentSource.Clickup) {
		const taskIdInPath = values.folder_path_ids
			?.findLast((str) => str.startsWith("TASK_"))
			?.replace("TASK_", "");

		hrefForTask = taskIdInPath
			? `${CLIKUP_TASK_LINK}${taskIdInPath}`
			: undefined;
	}

	const ret: SourceMainValues<
		SourceForUserType.StandardDocument,
		StandardDocumentSourceType.Verbose
	> = {
		descriptionJSX: null,
		descriptionString,
		normalizedSource,
		relevance: NaN,
		titleString,
		id,

		get titleJSX() {
			const value =
				(values.link ?? hrefForTask) ? (
					<Link href={values.link! ?? hrefForTask!} title={titleString} />
				) : (
					<p className="max-h-full break-all truncate group-data-[is-drawer]/drawer:font-bold group-data-[is-drawer]/drawer:text-base group-data-[is-drawer]/drawer:text-link">
						<HighlightStringWithFilterRegex string={titleString} />
					</p>
				);

			// 'configurable: true' is implicit in object literals, allowing this.
			Object.defineProperty(this, "titleJSX", {
				configurable: false, // Locks it down
				enumerable: true,
				writable: false, // Set to true if you want it mutable later
				value,
			});

			return value;
		},
	};

	return ret;
}

export function getSourceMainValues(
	normalizedSource: NormalizedSource,
): SourceMainValues<SourceForUserType, NormalizedSource["values_type"]> {
	switch (normalizedSource.source_type) {
		case SourceForUserType.Website: {
			const values = normalizedSource.values as WebsiteSource;

			return {
				get titleJSX() {
					const value = (
						<Link
							href={values.link ?? values.identifier}
							title={values.identifier}
						/>
					);

					// 'configurable: true' is implicit in object literals, allowing this.
					Object.defineProperty(this, "titleJSX", {
						configurable: false, // Locks it down
						enumerable: true,
						writable: false, // Set to true if you want it mutable later
						value,
					});

					return value;
				},

				titleString: values.identifier,
				id: values.identifier,
				descriptionString: "",
				descriptionJSX: null,
				normalizedSource,
				relevance: NaN,
			};
		}

		case SourceForUserType.StandardDocument: {
			switch (normalizedSource.values_type) {
				case StandardDocumentSourceType.Minimal: {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return getMinimalStandardDocumentValues(normalizedSource) as any;
				}

				case StandardDocumentSourceType.Verbose: {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return getVerboseStandardDocumentValues(normalizedSource) as any;
				}

				default: {
					console.error("Failed to normalize StandardDocument sources:", {
						normalizedSource,
					});

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return makeUnkownValues(normalizedSource) as any;
				}
			}
		}

		case SourceForUserType.GoogleDrive: {
			switch (normalizedSource.values_type) {
				case GoogleDriveSourceType.Minimal: {
					const titleString =
						normalizedSource.values.fields.filename || "File on Google Drive";

					return {
						descriptionString: removeSourceCitations(
							normalizedSource.values.fields.long_text_data?.join("") || "",
						),
						id: normalizedSource.values.id || (`${Math.random()}` as SourceID),
						relevance: normalizedSource.values.relevance,
						descriptionJSX: null,
						normalizedSource,
						titleString,

						get titleJSX() {
							const value = normalizedSource.values.link ? (
								<Link href={normalizedSource.values.link} title={titleString} />
							) : (
								<p className="max-h-full break-all truncate group-data-[is-drawer]/drawer:font-bold group-data-[is-drawer]/drawer:text-base group-data-[is-drawer]/drawer:text-link">
									{titleString}
								</p>
							);

							// 'configurable: true' is implicit in object literals, allowing this.
							Object.defineProperty(this, "titleJSX", {
								configurable: false, // Locks it down
								enumerable: true,
								writable: false, // Set to true if you want it mutable later
								value,
							});

							return value;
						},
					};
				}

				case GoogleDriveSourceType.Verbose: {
					const titleString = `${normalizedSource.values.file_name ?? "File on Google Drive"}`;

					return {
						descriptionString: removeSourceCitations(
							normalizedSource.values.content_list
								.map((item) =>
									item.type === GoogleDriveContentType.Text ? item.text : "",
								)
								.join("") || "",
						),
						id:
							normalizedSource.values.id ??
							normalizedSource.values.file_id ??
							(`${Math.random()}` as SourceID),
						relevance: normalizedSource.values.calculated_score ?? NaN,
						descriptionJSX: null,
						normalizedSource,
						titleString,

						get titleJSX() {
							const value = normalizedSource.values.link ? (
								<Link href={normalizedSource.values.link} title={titleString} />
							) : (
								<p className="max-h-full break-all truncate group-data-[is-drawer]/drawer:font-bold group-data-[is-drawer]/drawer:text-base group-data-[is-drawer]/drawer:text-link">
									{titleString}
								</p>
							);

							// 'configurable: true' is implicit in object literals, allowing this.
							Object.defineProperty(this, "titleJSX", {
								configurable: false, // Locks it down
								enumerable: true,
								writable: false, // Set to true if you want it mutable later
								value,
							});

							return value;
						},
					};
				}

				default: {
					console.warn("Failed to normalize GoogleDrive sources:", {
						normalizedSource,
					});

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return makeUnkownValues(normalizedSource) as any;
				}
			}
		}

		case SourceForUserType.SqlQuery: {
			const values = normalizedSource.values as SQLQueryType;

			return {
				descriptionString: removeSourceCitations(values?.description || ""),
				id: values.id || (`${Math.random()}` as SourceID),
				relevance: values.relevance || NaN,
				titleString: values.query,
				descriptionJSX: null,
				normalizedSource,

				get titleJSX() {
					const value = values.link ? (
						<Link title={values.description} href={values.link} />
					) : (
						<SqlQueryTitleDialogTrigger
							normalizedSource={normalizedSource}
							titleString={values.query}
						/>
					);

					// 'configurable: true' is implicit in object literals, allowing this.
					Object.defineProperty(this, "titleJSX", {
						configurable: false, // Locks it down
						enumerable: true,
						writable: false, // Set to true if you want it mutable later
						value,
					});

					return value;
				},
			};
		}

		case SourceForUserType.DataSchema: {
			const values = normalizedSource.values as DataSchemaEntity;

			return {
				id: values.id || (`${Math.random()}` as SourceID),
				descriptionString: values.database_name || "",
				relevance: values.relevance || NaN,
				titleString: values.name || "",
				descriptionJSX: null,
				normalizedSource,

				get titleJSX() {
					const value = values.link ? (
						<Link title={values.name} href={values.link} />
					) : (
						<DataSchemaTitleLink normalizedSource={normalizedSource} />
					);

					// 'configurable: true' is implicit in object literals, allowing this.
					Object.defineProperty(this, "titleJSX", {
						configurable: false, // Locks it down
						enumerable: true,
						writable: false, // Set to true if you want it mutable later
						value,
					});

					return value;
				},
			};
		}

		case SourceForUserType.Airtable: {
			const values = normalizedSource.values as AirtableRecord;

			return {
				id: values.id || (`${Math.random()}` as SourceID),
				titleString: values.table_name || "",
				descriptionString: values.url || "",
				relevance: values.relevance || NaN,
				normalizedSource,

				get descriptionJSX() {
					const value = (
						<AirtableDescription normalizedSource={normalizedSource} />
					);

					// 'configurable: true' is implicit in object literals, allowing this.
					Object.defineProperty(this, "descriptionJSX", {
						configurable: false, // Locks it down
						enumerable: true,
						writable: false, // Set to true if you want it mutable later
						value,
					});

					return value;
				},

				get titleJSX() {
					const value = (
						<Link
							href={values.link ?? values.table_name}
							title={values.table_name}
						/>
					);

					// 'configurable: true' is implicit in object literals, allowing this.
					Object.defineProperty(this, "titleJSX", {
						configurable: false, // Locks it down
						enumerable: true,
						writable: false, // Set to true if you want it mutable later
						value,
					});

					return value;
				},
			};
		}

		case SourceForUserType.ModeDefinition: {
			const values = normalizedSource.values as ModeDefinitionType;

			return {
				id: values.id || (`${Math.random()}` as SourceID),
				descriptionString: values.description || "",
				relevance: values.relevance || NaN,
				titleString: values.name || "",
				descriptionJSX: null,
				normalizedSource,
				get titleJSX() {
					const value = values.link ? (
						<Link title={values.query} href={values.link} />
					) : (
						<ModeDefinitionTitleTrigger normalizedSource={normalizedSource} />
					);

					// 'configurable: true' is implicit in object literals, allowing this.
					Object.defineProperty(this, "titleJSX", {
						configurable: false, // Locks it down
						enumerable: true,
						writable: false, // Set to true if you want it mutable later
						value,
					});

					return value;
				},
			};
		}

		case SourceForUserType.ModeQuery: {
			const values = normalizedSource.values as ModeQueryType;

			return {
				id: values.id || (`${Math.random()}` as SourceID),
				descriptionString: values.query || "",
				relevance: values.relevance || NaN,
				titleString: values.name || "",
				descriptionJSX: null,
				normalizedSource,
				get titleJSX() {
					const value = values.link ? (
						<Link title={values.query} href={values.link} />
					) : (
						<ModeQueryTitleTrigger normalizedSource={normalizedSource} />
					);

					// 'configurable: true' is implicit in object literals, allowing this.
					Object.defineProperty(this, "titleJSX", {
						configurable: false, // Locks it down
						enumerable: true,
						writable: false, // Set to true if you want it mutable later
						value,
					});

					return value;
				},
			};
		}

		case SourceForUserType.Slack: {
			const values = normalizedSource.values as SlackConversation;

			return {
				titleString: values.channel_name || "Slack conversation snippet",
				id: values.id || (`${Math.random()}` as SourceID),
				descriptionString: values.url || "",
				relevance: values.relevance || NaN,
				normalizedSource,
				get descriptionJSX() {
					const value = (
						<SlackConversations normalizedSource={normalizedSource} />
					);

					// 'configurable: true' is implicit in object literals, allowing this.
					Object.defineProperty(this, "descriptionJSX", {
						configurable: false, // Locks it down
						enumerable: true,
						writable: false, // Set to true if you want it mutable later
						value,
					});

					return value;
				},
				get titleJSX() {
					const value = (
						<Link
							title={values.channel_name || "Slack conversation snippet"}
							href={values.link || values.url}
						/>
					);

					// 'configurable: true' is implicit in object literals, allowing this.
					Object.defineProperty(this, "titleJSX", {
						configurable: false, // Locks it down
						enumerable: true,
						writable: false, // Set to true if you want it mutable later
						value,
					});

					return value;
				},
			};
		}

		case SourceForUserType.Pdf: {
			const values = normalizedSource.values as PdfSnippet;

			return {
				id: values.id || (`${Math.random()}` as SourceID),
				titleString: `${values.pdf_id}` || "",
				descriptionString: values.text || "",
				relevance: values.relevance || NaN,
				normalizedSource,

				get descriptionJSX() {
					const value = (
						<div className="text-xs">
							<HighlightStringWithFilterRegex
								string={values.text.slice(0, 100)}
							/>
						</div>
					);

					// 'configurable: true' is implicit in object literals, allowing this.
					Object.defineProperty(this, "descriptionJSX", {
						configurable: false, // Locks it down
						enumerable: true,
						writable: false, // Set to true if you want it mutable later
						value,
					});

					return value;
				},

				get titleJSX() {
					const value = values.link ? (
						<Link title="PDF file snippet" href={values.link} />
					) : (
						<PdfTitlePopoverTrigger normalizedSource={normalizedSource} />
					);

					// 'configurable: true' is implicit in object literals, allowing this.
					Object.defineProperty(this, "titleJSX", {
						configurable: false, // Locks it down
						enumerable: true,
						writable: false, // Set to true if you want it mutable later
						value,
					});

					return value;
				},
			};
		}

		case SourceForUserType.Web: {
			const values = normalizedSource.values as WebsiteSnippet;

			return {
				id: values.id || (`${Math.random()}` as SourceID),
				descriptionString: values.description || "",
				relevance: values.relevance || NaN,
				titleString: values.title || "",
				descriptionJSX: null,
				normalizedSource,

				get titleJSX() {
					const value = (
						<Link href={values.link ?? values.url} title={values.title} />
					);

					// 'configurable: true' is implicit in object literals, allowing this.
					Object.defineProperty(this, "titleJSX", {
						configurable: false, // Locks it down
						enumerable: true,
						writable: false, // Set to true if you want it mutable later
						value,
					});

					return value;
				},
			};
		}

		case SourceForUserType.Affinity: {
			if (!normalizedSource.values) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return makeUnkownValues(normalizedSource) as any;
			}

			switch (normalizedSource.data_key) {
				case "organizations": {
					const values = normalizedSource.values as AffinityOrganization;

					return {
						descriptionString: values.long_text_field_data?.[0] || "",
						id: values.id || (`${Math.random()}` as SourceID),
						titleString: values.organization_name || "",
						relevance: values.relevance || NaN,
						descriptionJSX: null,
						normalizedSource,

						get titleJSX() {
							const value = values.link ? (
								<Link
									title={values.organization_name || AFFINITY_LINK}
									href={values.link}
								/>
							) : null;

							// 'configurable: true' is implicit in object literals, allowing this.
							Object.defineProperty(this, "titleJSX", {
								configurable: false, // Locks it down
								enumerable: true,
								writable: false, // Set to true if you want it mutable later
								value,
							});

							return value;
						},
					};
				}

				case "persons": {
					const values = normalizedSource.values as AffinityPerson;

					return {
						descriptionString: values.long_text_field_data?.[0] || "",
						id: values.id || (`${Math.random()}` as SourceID),
						relevance: values.relevance || NaN,
						titleString: values.name || "",
						descriptionJSX: null,
						normalizedSource,

						get titleJSX() {
							const value = values.link ? (
								<Link title={values.name || AFFINITY_LINK} href={values.link} />
							) : null;

							// 'configurable: true' is implicit in object literals, allowing this.
							Object.defineProperty(this, "titleJSX", {
								configurable: false, // Locks it down
								enumerable: true,
								writable: false, // Set to true if you want it mutable later
								value,
							});

							return value;
						},
					};
				}

				case "notes": {
					const values = normalizedSource.values as AffinityNote;

					return {
						id: values.id || (`${Math.random()}` as SourceID),
						titleString: values.organization_name || "",
						descriptionString: values.note || "",
						relevance: values.relevance || NaN,
						descriptionJSX: null,
						normalizedSource,

						get titleJSX() {
							const value = values.link ? (
								<Link title={values.note || AFFINITY_LINK} href={values.link} />
							) : null;

							// 'configurable: true' is implicit in object literals, allowing this.
							Object.defineProperty(this, "titleJSX", {
								configurable: false, // Locks it down
								enumerable: true,
								writable: false, // Set to true if you want it mutable later
								value,
							});

							return value;
						},
					};
				}

				case "introductions": {
					switch (normalizedSource.values_type) {
						case AffinitySourceType.AffinityIntroductionsMadeBy: {
							return {
								descriptionString:
									normalizedSource.values.person_making_intro_email?.toLocaleLowerCase() ||
									"",
								titleString:
									normalizedSource.values.person_making_intro_name || "",
								id:
									normalizedSource.values.id ||
									(`${Math.random()}` as SourceID),
								relevance: normalizedSource.relevance || NaN,
								descriptionJSX: null,
								normalizedSource,

								get titleJSX() {
									const value = normalizedSource.values.link ? (
										<Link
											href={normalizedSource.values.link}
											title={AFFINITY_LINK}
										/>
									) : null;

									// 'configurable: true' is implicit in object literals, allowing this.
									Object.defineProperty(this, "titleJSX", {
										configurable: false, // Locks it down
										enumerable: true,
										writable: false, // Set to true if you want it mutable later
										value,
									});

									return value;
								},
							};
						}

						case AffinitySourceType.AffinityIntroductionsMadeTo: {
							return {
								descriptionString:
									normalizedSource.values.person_receiving_intro_email?.toLocaleLowerCase() ||
									"",
								titleString:
									normalizedSource.values.person_receiving_intro_name || "",
								id:
									normalizedSource.values.id ||
									(`${Math.random()}` as SourceID),
								relevance: normalizedSource.relevance || NaN,
								descriptionJSX: null,
								normalizedSource,

								get titleJSX() {
									const value = normalizedSource.values.link ? (
										<Link
											href={normalizedSource.values.link}
											title={AFFINITY_LINK}
										/>
									) : null;

									// 'configurable: true' is implicit in object literals, allowing this.
									Object.defineProperty(this, "titleJSX", {
										configurable: false, // Locks it down
										enumerable: true,
										writable: false, // Set to true if you want it mutable later
										value,
									});

									return value;
								},
							};
						}

						default: {
							console.log(
								"Unknown source type. This should have a type to discriminate against.",
								{
									normalizedSource,
								},
							);

							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							return makeUnkownValues(normalizedSource) as any;
						}
					}
				}

				default: {
					console.log("Unknown source type at Affinity source for user.", {
						normalizedSource,
					});

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return makeUnkownValues(normalizedSource) as any;
				}
			}
		}

		default: {
			// assertUnreachable(source.source_type);

			console.log("Unknown source type", { normalizedSource });

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return makeUnkownValues(normalizedSource) as any;
		}
	}
}
