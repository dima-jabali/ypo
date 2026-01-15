import { capitalize } from "es-toolkit";
import {
	useEffect,
	useRef,
	useState,
	type Dispatch,
	type SetStateAction,
} from "react";
import { ZodError } from "zod";

import { clientAPI_V1 } from "#/api";
import { Button, ButtonVariant } from "#/components/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "#/components/Dialog";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { dataManagerStore } from "#/contexts/data-manager";
import { useWithOrganizationId } from "#/contexts/general-ctx/general-context";
import { cn } from "#/helpers/class-names";
import { createISODate, getErrorMessage } from "#/helpers/utils";
import { useFetchBetterbrainUser } from "#/hooks/fetch/use-fetch-betterbrain-user";
import { useCreateIntegration } from "#/hooks/mutation/use-create-integration";
import { useIsIntegrating } from "#/hooks/mutation/use-is-integrating";
import {
	BotSourceFormAction,
	BotSourceType,
	type BotSource,
	type BotSourceId,
	type WebBotSource,
} from "#/types/bot-source";
import type { CreateConnectionObject } from "#/types/connection-creation";
import { DatabaseConnectionType } from "#/types/databases";
import { PermissionType } from "#/types/notebook";
import { EditOrCreateBotSourceDialog } from "../bots/edit/EditOrCreateBotSource/EditOrCreateBotSourceDialog";
import {
	DialogToOpenWithError,
	type AttemptToConnectStatus,
} from "../use-attempt-to-connect-status";
import { AirtableForm } from "./airtable-form";
import { BigQueryForm } from "./big-query-form";
import { connectionsData } from "./connections-data";
import { GoogleDriveForm } from "./google-drive-form";
import { PostgresForm } from "./postgres-form";
import { SlackForm } from "./slack-form";
import { SnowflakeForm } from "./snowflake-form";
import {
	AIRTABLE_CONNECTION_NAME_INPUT_ID,
	AIRTABLE_PAT_INPUT_ID,
	assureHasPrivateKeyIdField,
	getConstrainedData,
} from "./utils";
import { YouTubeForm } from "./youtube-form";

type Props = {
	attemptToConnectStatus?: AttemptToConnectStatus | undefined;
	dbToCreate?: DatabaseConnectionType;
	className?: string;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
};

type ConnectToYouTubeResponse = {
	authorization_url: string;
};

const CONNECT_TO_SLACKS_WORKSPACE_URL = process.env
	.NEXT_PUBLIC_CONNECT_TO_SLACKS_WORKSPACE_URL;

if (!CONNECT_TO_SLACKS_WORKSPACE_URL) {
	throw new Error("Missing NEXT_PUBLIC_CONNECT_TO_SLACKS_WORKSPACE_URL");
}

export function DBConnectionModalContent({
	attemptToConnectStatus,
	dbToCreate,
	className,
	setIsOpen,
}: Props) {
	const [databaseToConnect, setDatabaseToConnect] = useState<
		DatabaseConnectionType | undefined
	>(dbToCreate);
	const [botSourceBeingCreated, setBotSourceBeingCreated] =
		useState<BotSource | null>(null);
	const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
	const [, setNextBotSources] = useState<BotSource[]>([]);
	const [databaseName, setDatabaseName] = useState("");

	const formRef = useRef<HTMLFormElement | null>(null);

	const createGoogleDriveIntegration =
		useCreateIntegration<DatabaseConnectionType.GoogleDrive>();
	const createAirtableIntegration =
		useCreateIntegration<DatabaseConnectionType.Airtable>();
	const createPostgresIntegration =
		useCreateIntegration<DatabaseConnectionType.Postgres>();
	const betterbrainUser = useFetchBetterbrainUser();
	const organizationId = useWithOrganizationId();
	const isIntegrating = useIsIntegrating();

	const [forms] = useState(() => ({
		[connectionsData[0].kind]: <SnowflakeForm />,
		[connectionsData[1].kind]: <PostgresForm formRef={formRef} />,
		[connectionsData[2].kind]: <BigQueryForm />,
		[connectionsData[3].kind]: <SlackForm />,
		[connectionsData[4].kind]: <AirtableForm formRef={formRef} />,
		[connectionsData[5].kind]: <GoogleDriveForm formRef={formRef} />,
		[connectionsData[6].kind]: null,
		[connectionsData[7].kind]: <YouTubeForm formRef={formRef} />,
	}));

	useEffect(() => {
		setDatabaseName(
			connectionsData.find((item) => item.kind === databaseToConnect)?.name ??
				"",
		);
	}, [databaseToConnect]);

	useEffect(() => {
		if (!attemptToConnectStatus) return;

		if (
			attemptToConnectStatus.dialogToOpenWithError !==
			DialogToOpenWithError.none
		) {
			setDatabaseName(attemptToConnectStatus.dialogToOpenWithError);
			setIsErrorDialogOpen(true);
		}
	}, [attemptToConnectStatus]);

	const isLoading =
		isIntegrating ||
		createGoogleDriveIntegration.isPending ||
		createAirtableIntegration.isPending ||
		createPostgresIntegration.isPending;

	async function handleConnectToSlackWorkspace() {
		if (isIntegrating) return;

		if (!CONNECT_TO_SLACKS_WORKSPACE_URL) {
			console.error('Missing "NEXT_PUBLIC_CONNECT_TO_SLACKS_WORKSPACE_URL"');

			toast({
				description: "This should never happen! Please, contact support!",
				title: "Missing NEXT_PUBLIC_CONNECT_TO_SLACKS_WORKSPACE_URL",
				variant: ToastVariant.Destructive,
			});

			return;
		}

		const url = new URL(CONNECT_TO_SLACKS_WORKSPACE_URL);

		url.searchParams.append(
			"redirect_uri",
			`https://api.${
				process.env.NODE_ENV === "production" ? "" : "staging."
			}betterbrain.ai/api/integration/slack/test/auth`,
		);
		url.searchParams.append("state", `{"organization_id": ${organizationId}}`);

		window.location.assign(url);
	}

	async function handleConnectToYouTube() {
		if (!formRef.current || isIntegrating) return;

		const formData = new FormData(formRef.current);
		const formEntries = Object.fromEntries(formData);
		const connectionName = formEntries["connection_name"] as string | undefined;

		if (!connectionName) {
			toast({
				title: "YouTube connection name is required!",
				variant: ToastVariant.Destructive,
			});

			return;
		}

		try {
			const connectToYouTubeResponse =
				await clientAPI_V1.get<ConnectToYouTubeResponse>(
					`/integrations/organizations/${organizationId}/google/oauth/authorize?connection_name=${encodeURIComponent(
						connectionName,
					)}&oauth_type=YOUTUBE_DATA_API_V3`,
				);

			const authorizationUrl = connectToYouTubeResponse.data.authorization_url;

			if (!authorizationUrl) {
				throw new Error("Missing authorization URL!");
			}

			window.location.assign(authorizationUrl);
		} catch (error) {
			console.error("Error connecting to YouTube.", error);

			setIsErrorDialogOpen(true);

			toast({
				title: "Error connecting to YouTube!",
				variant: ToastVariant.Destructive,
			});
		}
	}

	async function handleConnectToAirtableWorkspace() {
		if (!formRef.current || isIntegrating) return;

		const formData = new FormData(formRef.current);
		const formEntries = Object.fromEntries(formData);
		const name = formEntries[AIRTABLE_CONNECTION_NAME_INPUT_ID] as
			| string
			| undefined;
		const airtablePAT = formEntries[AIRTABLE_PAT_INPUT_ID] as
			| string
			| undefined;

		if (!name) {
			toast({
				title: "Airtable connection name is required!",
				variant: ToastVariant.Destructive,
			});

			return;
		}
		if (!airtablePAT) {
			toast({
				title: "Airtable Personal Access Token is required!",
				variant: ToastVariant.Destructive,
			});

			return;
		}

		try {
			const airtableConnection = await createAirtableIntegration.mutateAsync({
				connection_info: {
					personal_access_token: airtablePAT,
				},
				connection_type: DatabaseConnectionType.Airtable,
				permission_type: PermissionType.Organization,
				// client_id: AIRTABLE_CLIENT_ID,
				name,
			});

			dataManagerStore.setState({
				...dataManagerStore.getInitialState(),
				connectionType: DatabaseConnectionType.Airtable,
				connectionId: airtableConnection.id,
			});
		} catch (error) {
			console.error("Error connecting to Airtable!", error);

			toast({
				title: "Error connecting to Airtable",
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
			});
		}
	}

	async function handleConnectToPostgres() {
		if (isIntegrating || !formRef.current || !databaseToConnect) return;

		const formData = new FormData(formRef.current);
		const formEntries = Object.fromEntries(formData);
		const permission_type = formEntries["permission_type"]
			? PermissionType.Organization
			: PermissionType.User;

		try {
			// Right now, this is only made to work with Postgres as it is the
			// only one that is supported at the moment.
			const connection_info = getConstrainedData(databaseToConnect)?.(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				formEntries as any,
			);

			if (!connection_info) return;

			const integrationData: CreateConnectionObject<DatabaseConnectionType.Postgres> =
				{
					connection_type: databaseToConnect,
					name: formEntries.name as string,
					permission_type,
					connection_info,
				};

			try {
				await createPostgresIntegration.mutateAsync(integrationData);

				setIsOpen(false);
			} catch (error) {
				console.error(error);

				setIsErrorDialogOpen(true);
			}
		} catch (error) {
			console.error(error);
		}
	}

	async function handleConnectToGoogleDrive() {
		if (isIntegrating || !formRef.current || !databaseToConnect) return;

		const formEntries = Object.fromEntries(new FormData(formRef.current));

		try {
			const serviceAccountInfoAsString = formEntries[
				"service_account_info"
			] as string;

			if (!serviceAccountInfoAsString) {
				throw new Error("Service Account Info is required!");
			}
			if (!formEntries["name"]) {
				throw new Error("Connection name is required!");
			}

			// Assure it is a valid JSON with the necessary fields:
			const service_account_info = JSON.parse(serviceAccountInfoAsString);
			assureHasPrivateKeyIdField.parse(service_account_info);

			try {
				await createGoogleDriveIntegration.mutateAsync({
					connection_info: {
						service_account_info,
					},
					connection_type: DatabaseConnectionType.GoogleDrive,
					permission_type: PermissionType.Organization,
					name: formEntries.name as string,
				});

				setIsOpen(false);
			} catch (error) {
				console.error(error);

				setIsErrorDialogOpen(true);
			}
		} catch (error) {
			console.error(error);

			if (error instanceof ZodError) {
				error.issues.forEach((issue) => {
					const prop = capitalize(issue.path[0] as string);

					toast({
						description: issue.message.replace("String", prop),
						variant: ToastVariant.Destructive,
						title: "Form error",
					});
				});
			} else {
				toast({
					description: getErrorMessage(error),
					title: "Database connection error",
					variant: ToastVariant.Destructive,
				});
			}
		}
	}

	async function handleConnect() {
		if (isIntegrating) return;

		switch (databaseToConnect) {
			case DatabaseConnectionType.Slack:
				return await handleConnectToSlackWorkspace();

			case DatabaseConnectionType.Postgres:
				return await handleConnectToPostgres();

			case DatabaseConnectionType.Airtable:
				return await handleConnectToAirtableWorkspace();

			case DatabaseConnectionType.GoogleDrive:
				return await handleConnectToGoogleDrive();

			case DatabaseConnectionType.YouTube:
				return await handleConnectToYouTube();

			default:
				console.log("Database type not implemented yet!", {
					databaseToConnect,
				});
				return;
		}
	}

	function handleCloseCreateBotSourceDialog() {
		setBotSourceBeingCreated(null);
	}

	function handleChooseDB(detail: (typeof connectionsData)[number]) {
		if (detail.disabled) return;

		if (detail.kind === DatabaseConnectionType.ExternalDatasource) {
			const created_at = createISODate();

			const webBotSource: WebBotSource = {
				last_modified_by: betterbrainUser,
				source_type: BotSourceType.Web,
				created_by: betterbrainUser,
				id: NaN as BotSourceId,
				updated_at: created_at,
				archived: false,
				description: "",
				web_crawls: [],
				websites: [],
				created_at,
				bots: [],
				name: "",
			};

			setBotSourceBeingCreated(webBotSource);
		} else {
			setDatabaseToConnect(detail.kind);
		}
	}

	const isCreatingBotSource = botSourceBeingCreated !== null;

	if (dbToCreate) {
		return (
			<>
				{/* @ts-expect-error => undefined will simply return undefined. */}
				{forms[databaseToConnect]}

				<div className="flex w-full items-center justify-end gap-2">
					<DialogTrigger asChild>
						<Button variant={ButtonVariant.OUTLINE}>Cancel</Button>
					</DialogTrigger>

					<Button
						variant={ButtonVariant.SUCCESS}
						onClick={handleConnect}
						isLoading={isLoading}
						autoFocus
					>
						Connect{isLoading ? "ing..." : ""}
					</Button>
				</div>
			</>
		);
	}

	return (
		<>
			<DialogTitle>Connect to a database</DialogTitle>

			<DialogDescription>
				Choose a database to create a connection with:
			</DialogDescription>

			<div className="mb-8 grid w-full grid-cols-2 justify-center gap-3">
				{connectionsData.map((detail, index) => {
					return (
						<button
							className="flex h-28 w-full flex-col items-center justify-center gap-3 border border-border-smooth  bg-blue-900/40 p-3 hover:bg-blue-900/60 disabled:opacity-70 disabled:hover:bg-blue-900/40 active:bg-blue-900/80"
							title={`Connect to a ${detail.name} database`}
							onClick={() => handleChooseDB(detail)}
							disabled={detail.disabled}
							type="button"
							key={index}
						>
							{detail.icon}

							<p className="tracking-wide">{detail.name}</p>
						</button>
					);
				})}
			</div>

			<p className="text-center">
				Don&apos;t see a connection you wish we had?&nbsp;
				<a
					className="link hover:underline"
					href="mailto:support@betterbrain.ai"
				>
					Let us know
				</a>
			</p>

			<>
				{/* Form Dialog */}
				<Dialog
					open={Boolean(databaseToConnect) && !isCreatingBotSource}
					onOpenChange={() => setDatabaseToConnect(undefined)}
				>
					<DialogContent
						className={cn(
							"flex max-h-[90vh] flex-col border-border-smooth bg-popover text-primary p-9 pb-6 simple-scrollbar z-500",
							className,
						)}
						overlayClassName={cn("form-dialog", className)}
					>
						{/* @ts-expect-error => undefined will simply return undefined. */}
						{forms[databaseToConnect]}

						<div className="flex w-full items-center justify-end gap-2">
							<DialogTrigger asChild>
								<Button variant={ButtonVariant.OUTLINE}>Cancel</Button>
							</DialogTrigger>

							<Button
								variant={ButtonVariant.SUCCESS}
								isLoading={isIntegrating}
								onClick={handleConnect}
								autoFocus
							>
								Connect{isIntegrating ? "ing..." : ""}
							</Button>
						</div>
					</DialogContent>
				</Dialog>

				{isCreatingBotSource ? (
					<DefaultSuspenseAndErrorBoundary
						fallbackFor="edit-or-create-bot-source"
						failedText="Something went wrong at 'Edit or Create Bot Source'!"
					>
						<EditOrCreateBotSourceDialog
							setBotSourceBeingEditedOrAdded={setBotSourceBeingCreated}
							closeDialog={handleCloseCreateBotSourceDialog}
							setNextBotSources={setNextBotSources}
							action={BotSourceFormAction.Create}
							source={botSourceBeingCreated}
						/>
					</DefaultSuspenseAndErrorBoundary>
				) : null}
			</>

			{/* Error dialog */}
			<Dialog onOpenChange={setIsErrorDialogOpen} open={isErrorDialogOpen}>
				<DialogContent className="flex flex-col overflow-auto border-border-smooth p-9 pb-6 z-500">
					<DialogTitle>
						Error connecting to&nbsp;
						<span className="inline-block text-[#f9abfd] underline">{`${databaseName}'s`}</span>
						&nbsp;database
					</DialogTitle>

					<DialogDescription>
						We could not create your connection. We&apos;ve logged the error and
						are working on it.
					</DialogDescription>

					<p className="mt-5">
						{attemptToConnectStatus?.error.replaceAll('"', "")}
					</p>

					<DialogTrigger className="mt-10" asChild>
						<Button variant={ButtonVariant.OUTLINE}>Ok</Button>
					</DialogTrigger>
				</DialogContent>
			</Dialog>
		</>
	);
}
