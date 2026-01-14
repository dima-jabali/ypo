import { Check, Cloud, Search, Share2, Trash, X } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useRef, useState } from "react";

import {
	getErrorMessage,
	isValidNumber,
	preventDefault,
} from "#/helpers/utils";
import {
	useFetchAllOrganizations,
	type Organization,
} from "#/hooks/fetch/use-fetch-all-organizations";
import { useFetchBetterbrainUser } from "#/hooks/fetch/use-fetch-betterbrain-user";
import { useDownloadedNotebookMetadata } from "#/hooks/fetch/use-fetch-notebook";
import { useUpdateNotebookMetadata } from "#/hooks/mutation/use-update-notebook-metadata";
import { useAllUsersFromCurrentOrg } from "#/hooks/use-all-users-from-current-org";
import { useCurrentOrganization } from "#/hooks/use-current-organization";
import type { NotebookId, OrganizationId } from "#/types/general";
import {
	PERMISSION_LEVELS,
	PermissionLevel,
	PermissionType,
	type BetterbrainUser,
	type NotebookMetadata,
	type NotebookPermission,
	type NotebookPermissionId,
} from "#/types/notebook";
import { Avatar, AvatarFallback, AvatarImage } from "../Avatar";
import { Badge } from "../Badge";
import { Button, ButtonVariant, LOADER } from "../Button";
import { InputWithIcons } from "../Input";
import { Loader } from "../Loader";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";
import { ToastVariant } from "../Toast/ToastVariant";
import { toast } from "../Toast/useToast";
import { getUserNameOrEmail } from "./projects-helper";

const TIMEOUT_TO_SEARCH_EMAIL = 250;

enum Tab {
	SharedWith = "Shared with",
	Share = "Share",
}

export function ShareProjectModal() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Anchor className="fixed bottom-24 left-[141px] size-3.5" />
			</PopoverPrimitive.Portal>

			<PopoverTrigger
				className="button-hover text-sm flex items-center justify-center rounded-lg w-12 p-2 h-9"
				title="Share project"
			>
				<Share2 className="w-5 stroke-1 stroke-muted-foreground" />
			</PopoverTrigger>

			{isOpen ? <Content /> : null}
		</Popover>
	);
}

function throwIfNotAtLeastOneAdmin(newPermissions: Array<NotebookPermission>) {
	if (newPermissions.length === 0) {
		throw new Error(
			"At least one admin is required. There are no permissions.",
		);
	}

	let hasOneAdmin = false;

	for (const permission of newPermissions) {
		if (
			permission.user !== null &&
			permission.permission_level === PermissionLevel.Admin
		) {
			hasOneAdmin = true;

			break;
		}
	}

	if (!hasOneAdmin) {
		throw new Error("At least one admin is required.");
	}
}

function Content() {
	const [activeTab, setActiveTab] = useState(Tab.SharedWith);

	const timerToSearchEmailRef = useRef<NodeJS.Timeout>(undefined);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const formRef = useRef<HTMLFormElement>(null);

	const updateNotebookMetadata = useUpdateNotebookMetadata();
	const allUsersFromCurrentOrg = useAllUsersFromCurrentOrg();
	const notebookMetadata = useDownloadedNotebookMetadata();
	const allOrganizations = useFetchAllOrganizations();
	const betterbrainUser = useFetchBetterbrainUser();

	const [searchUserResults, setSearchUserResults] = useState(
		allUsersFromCurrentOrg,
	);

	const hasResults = searchUserResults.length > 0;
	const notebookId = notebookMetadata.id;
	const userId = betterbrainUser.id;

	const organizationsAlreadySharedWith = new Set(
		notebookMetadata.permissions?.map(
			(permission) => permission.organization?.id,
		),
	);
	const canUserChangePermissions = Boolean(
		notebookMetadata.created_by.id === userId ||
			notebookMetadata.permissions?.find(
				(permission) =>
					permission.user?.id === userId &&
					permission.permission_level === PermissionLevel.Admin,
			),
	);

	console.log({ canUserChangePermissions, notebookMetadata });

	function getFormData() {
		const form = formRef.current;

		if (!form) return;

		const entries = [...new FormData(form).entries()];

		const newPermissions = [
			...structuredClone(notebookMetadata.permissions ?? []),
		];

		for (const [key, value] of entries) {
			const searchParams = new URLSearchParams(key);
			const type = searchParams.get("type") as "level";

			console.log({ type, key, value, searchParams: searchParams.toString() });

			switch (type) {
				case "level": {
					const permissionId = Number(
						searchParams.get("permission-id") || undefined,
					) as NotebookPermissionId;

					if (isValidNumber(permissionId)) {
						const permission = newPermissions.find(
							(permission) => permission.id === permissionId,
						);

						if (permission) {
							permission.permission_level = value as PermissionLevel;
						}
					}

					break;
				}

				default:
					break;
			}
		}

		console.log({
			entries,
			oldPermissions: notebookMetadata.permissions,
			newPermissions,
		});

		return newPermissions;
	}

	function handlePerformLocalSearch(normalizedSearchValue: string) {
		// Filter users by partial matches in name or email
		const filteredUsers = allUsersFromCurrentOrg.filter((user) => {
			const fullName =
				`${user.first_name} ${user.last_name} ${user.email}`.toLowerCase();
			const email = user.email.toLowerCase();

			return (
				fullName.includes(normalizedSearchValue) ||
				email.includes(normalizedSearchValue)
			);
		});

		return filteredUsers;
	}

	function handleSearchForUser(normalizedSearchValue: string) {
		setSearchUserResults(
			normalizedSearchValue
				? handlePerformLocalSearch(normalizedSearchValue)
				: allUsersFromCurrentOrg,
		);
	}

	function handleSearchUserInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		clearTimeout(timerToSearchEmailRef.current);

		const searchValue = e.target.value;

		timerToSearchEmailRef.current = setTimeout(() => {
			handleSearchForUser(searchValue.trim().toLocaleLowerCase());
		}, TIMEOUT_TO_SEARCH_EMAIL);
	}

	function handleChangeTab(tab: Tab) {
		setSearchUserResults(allUsersFromCurrentOrg);
		setActiveTab(tab);
	}

	function handleClearSearch() {
		setSearchUserResults(allUsersFromCurrentOrg);

		if (searchInputRef.current) {
			searchInputRef.current.value = "";
		}
	}

	return (
		<PopoverContent
			align="end"
			side="right"
			className="flex-col gap-2 flex max-h-[90vh]"
		>
			<Tabs
				onValueChange={(tab) => handleChangeTab(tab as Tab)}
				value={activeTab}
			>
				<TabsList className="shadow-none h-7 text-sm flex justify-between items-center bg-transparent gap-4 border-0 rounded-none border-b border-border-smooth w-full py-0">
					<div className="flex gap-4 h-full">
						{Object.values(Tab).map((tab) => (
							<TabsTrigger
								overwriteClassName="border-transparent border-b-2 data-[state=active]:border-accent text-xs h-full text-muted"
								value={tab}
								key={tab}
							>
								{tab}
							</TabsTrigger>
						))}
					</div>

					<div className="flex h-full items-center justify-center gap-1 text-primary">
						{updateNotebookMetadata.isPending ? (
							<Loader className="size-3 mr-1 border-t-primary" />
						) : updateNotebookMetadata.isError ? (
							<X className="size-3 stroke-destructive" />
						) : (
							<Cloud className="size-4 text-muted-foreground" />
						)}

						<p
							className="min-w-max text-xs data-[is-error=true]:text-destructive text-muted"
							data-is-error={updateNotebookMetadata.isError}
						>
							{updateNotebookMetadata.isPending
								? "Saving..."
								: updateNotebookMetadata.isError
									? "Error"
									: "Saved"}
						</p>
					</div>
				</TabsList>

				<TabsContent
					className="flex flex-col gap-6 min-w-96 my-2"
					aria-label="Shared with"
					value={Tab.SharedWith}
					asChild
				>
					<form onSubmit={preventDefault} ref={formRef}>
						<ul className="flex flex-col gap-1 max-h-[50vh] simple-scrollbar">
							{notebookMetadata.permissions?.map((permission) => (
								<PermissionsListItem
									canUserChangePermissions={canUserChangePermissions}
									updateNotebookMetadata={updateNotebookMetadata}
									getFormData={getFormData}
									permission={permission}
									notebookId={notebookId}
									key={permission.id}
									userId={userId}
								/>
							))}
						</ul>
					</form>
				</TabsContent>

				<TabsContent
					className="flex flex-col gap-4 min-w-96 mt-2"
					aria-label="Share"
					value={Tab.Share}
					asChild
				>
					<form
						className="flex flex-col gap-2"
						onSubmit={preventDefault}
						ref={formRef}
					>
						<InputWithIcons
							iconRight={
								<button
									className="rounded-full p-0.5 button-hover"
									onClick={handleClearSearch}
									type="button"
								>
									<X className="size-4 text-primary" />
								</button>
							}
							placeholder="Search for a user to share this project with"
							iconLeft={<Search className="size-4 text-primary" />}
							onChange={handleSearchUserInputChange}
							name="email-to-search"
							ref={searchInputRef}
							type="text"
						/>

						<ul
							className="max-h-40 data-[has-results=true]:min-h-[4rem] simple-scrollbar"
							data-has-results={hasResults}
						>
							{searchUserResults.length === 0 ? (
								<div className="flex min-h-10 text-xs text-muted/70 items-center justify-center mb-2 font-medium gap-2 text-balance text-center">
									No users found!
								</div>
							) : (
								searchUserResults.map((user) => (
									<SearchResult
										canUserChangePermissions={canUserChangePermissions}
										updateNotebookMetadata={updateNotebookMetadata}
										notebookMetadata={notebookMetadata}
										key={user.id}
										user={user}
									/>
								))
							)}
						</ul>

						<hr className="border-border-smooth flex-none w-full" />

						<h6 className="text-xs text-muted-foreground font-semibold pl-2">
							Organizations
						</h6>

						<ul className="flex flex-col w-full gap-0 max-h-[35vh] simple-scrollbar">
							{allOrganizations.length === 0 ? (
								<div className="flex w-full h-10 items-center justify-center text-xs text-muted/70 text-center">
									No organizations found!
								</div>
							) : (
								allOrganizations?.map((org) => (
									<OrganizationListItem
										organizationsAlreadySharedWith={
											organizationsAlreadySharedWith
										}
										updateNotebookMetadata={updateNotebookMetadata}
										canUserChangePermissions={canUserChangePermissions}
										getFormData={getFormData}
										notebookId={notebookId}
										key={org.id}
										org={org}
									/>
								))
							)}
						</ul>
					</form>
				</TabsContent>
			</Tabs>
		</PopoverContent>
	);
}

function PermissionsListItem({
	canUserChangePermissions,
	updateNotebookMetadata,
	permission,
	notebookId,
	userId,
	getFormData,
}: {
	updateNotebookMetadata: ReturnType<typeof useUpdateNotebookMetadata>;
	canUserChangePermissions: boolean;
	permission: NotebookPermission;
	userId: string | number;
	notebookId: NotebookId;
	getFormData: () => NotebookPermission[] | undefined;
}) {
	const [forceRender, setForceRender] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isChanging, setIsChanging] = useState(false);

	async function handleDeletePermission(permission: NotebookPermission) {
		if (updateNotebookMetadata.isPending || !canUserChangePermissions) return;

		try {
			setIsDeleting(true);

			const newPermissions = getFormData()?.filter(
				(newPermission) => newPermission.id !== permission.id,
			);

			if (!newPermissions) return;

			throwIfNotAtLeastOneAdmin(newPermissions);

			await updateNotebookMetadata.mutateAsync({
				permissions: newPermissions,
				notebookId,
			});

			toast({
				title: "Permission deleted successfully",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			setForceRender((prev) => !prev);

			const msg = "Error deleting permission";

			console.error(msg, error);

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: msg,
			});
		} finally {
			setIsDeleting(false);
		}
	}

	async function handleSavePermissionsChanges() {
		if (!canUserChangePermissions || updateNotebookMetadata.isPending) return;

		try {
			setIsChanging(true);

			const newPermissions = getFormData();

			if (!newPermissions) return;

			throwIfNotAtLeastOneAdmin(newPermissions);

			await updateNotebookMetadata.mutateAsync({
				permissions: newPermissions,
				notebookId,
			});

			toast({
				title: "Permission updated successfully",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			setForceRender((prev) => !prev);

			const msg = "Error updating permission";

			console.error(msg, error);

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: msg,
			});
		} finally {
			setIsChanging(false);
		}
	}

	const isOrganization =
		permission.organization !== null &&
		permission.user === null &&
		permission.permission_type === PermissionType.Organization;
	const isYou = permission.user?.id === userId;
	const nameOrEmail = isOrganization
		? (permission.organization!.name ?? "?")
		: permission.user
			? getUserNameOrEmail(permission.user)
			: "?";
	const avatarFallback =
		permission.user?.first_name.slice(0, 2) ??
		permission.organization?.name.slice(0, 2) ??
		"?";

	return (
		<li
			className="flex items-center justify-between gap-8 text-sm p-2 rounded-md"
			key={permission.id}
		>
			<div className="flex gap-2">
				<Avatar className="size-10">
					<AvatarImage src={permission.user?.image_url ?? undefined} />

					<AvatarFallback>{avatarFallback}</AvatarFallback>
				</Avatar>

				<div className="flex flex-col gap-0">
					<div>
						{nameOrEmail}
						{isYou ? (
							<span className="text-muted-foreground">&nbsp;(You)</span>
						) : null}
					</div>

					<div className="text-muted-foreground">
						{isOrganization ? "Organization" : permission.user?.email}
					</div>
				</div>
			</div>

			<div className="h-full items-center flex gap-1">
				<Select
					disabled={
						updateNotebookMetadata.isPending || !canUserChangePermissions
					}
					name={`type=level&permission-id=${permission.id}`}
					onValueChange={handleSavePermissionsChanges}
					defaultValue={permission.permission_level}
					key={`${forceRender}`}
				>
					<SelectTrigger
						className="w-20 gap-2 text-xs border-none p-2 h-fit hover:underline button-hover"
						title={
							canUserChangePermissions
								? `Chang${isChanging ? "ing" : "e"} permission level${isChanging ? "..." : ""}`
								: "You don't have permission to change this"
						}
					>
						<SelectValue />
					</SelectTrigger>

					<SelectContent>
						{PERMISSION_LEVELS.map((level) => (
							<SelectItem key={level} value={level}>
								{level}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Button
					className="size-8 p-0 disabled:pointer-events-none disabled:opacity-50"
					disabled={
						updateNotebookMetadata.isPending || !canUserChangePermissions
					}
					onClick={() => handleDeletePermission(permission)}
					variant={ButtonVariant.GHOST}
				>
					{isDeleting ? (
						LOADER
					) : (
						<Trash className="size-3 text-muted-foreground" />
					)}
				</Button>
			</div>
		</li>
	);
}

function OrganizationListItem({
	organizationsAlreadySharedWith,
	canUserChangePermissions,
	updateNotebookMetadata,
	notebookId,
	org,
	getFormData,
}: {
	updateNotebookMetadata: ReturnType<typeof useUpdateNotebookMetadata>;
	organizationsAlreadySharedWith: Set<OrganizationId | undefined>;
	canUserChangePermissions: boolean;
	notebookId: NotebookId;
	org: Organization;
	getFormData: () => NotebookPermission[] | undefined;
}) {
	const [isSharing, setIsSharing] = useState(false);

	const isAlreadyPresent = organizationsAlreadySharedWith.has(org.id);

	async function handleAddOrganization() {
		if (
			updateNotebookMetadata.isPending ||
			!canUserChangePermissions ||
			isAlreadyPresent ||
			isSharing
		) {
			return;
		}

		try {
			setIsSharing(true);

			const newPermissions = getFormData();

			if (!newPermissions) return;

			const doesPermissionAlreadyExist = newPermissions.some(
				(permission) => permission.organization?.id === org.id,
			);

			if (doesPermissionAlreadyExist) {
				throw new Error("Organization already has access to this project");
			}

			newPermissions.push({
				id: org.id as unknown as NotebookPermissionId,
				permission_type: PermissionType.Organization,
				permission_level: PermissionLevel.Read,
				organization: org,
				user: null,
			});

			throwIfNotAtLeastOneAdmin(newPermissions);

			await updateNotebookMetadata.mutateAsync({
				permissions: newPermissions,
				notebookId,
			});

			toast({
				title: "Shared with organization successfully",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			const msg = "Error sharing project with organization";

			console.error(msg, error);

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: msg,
			});
		} finally {
			setIsSharing(false);
		}
	}

	return (
		<button
			className="flex w-full items-center justify-between gap-3 rounded p-2 button-hover font-normal text-sm disabled:pointer-events-none"
			disabled={updateNotebookMetadata.isPending}
			title={`${org.name} (${org.id})`}
			data-is-active={isAlreadyPresent}
			onClick={handleAddOrganization}
			key={org.id}
		>
			<span className="truncate">{org.name}</span>

			{isAlreadyPresent ? (
				<Check className="h-5 w-5 shrink-0 text-primary" />
			) : isSharing ? (
				LOADER
			) : null}
		</button>
	);
}

function SearchResult({
	canUserChangePermissions,
	updateNotebookMetadata,
	notebookMetadata,
	user,
}: {
	updateNotebookMetadata: ReturnType<typeof useUpdateNotebookMetadata>;
	notebookMetadata: NotebookMetadata;
	canUserChangePermissions: boolean;
	user: BetterbrainUser;
}) {
	const [isSharing, setIsSharing] = useState(false);

	const currentOrganization = useCurrentOrganization();

	const nameOrEmail = getUserNameOrEmail(user);

	const userAlreadyHasAccess = notebookMetadata.permissions?.some(
		(permission) => permission.user?.id === user.id,
	);

	const handleShareWithUser = async () => {
		if (
			updateNotebookMetadata.isPending ||
			!canUserChangePermissions ||
			!currentOrganization ||
			userAlreadyHasAccess ||
			isSharing
		) {
			return;
		}

		try {
			setIsSharing(true);

			for (const userPermission of notebookMetadata.permissions ?? []) {
				if (userPermission.user?.id === user.id) {
					throw new Error("User already has access to this project");
				}
			}

			const newPermissions = [
				...structuredClone(notebookMetadata.permissions ?? []),
			];

			newPermissions.push({
				id: user.id as unknown as NotebookPermissionId,
				permission_level: PermissionLevel.Read,
				permission_type: PermissionType.User,
				organization: currentOrganization,
				user,
			});

			throwIfNotAtLeastOneAdmin(newPermissions);

			await updateNotebookMetadata.mutateAsync({
				notebookId: notebookMetadata.id,
				permissions: newPermissions,
			});

			toast({
				title: "Shared project with user successfully",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			const msg = `Error sharing project with user "${nameOrEmail}"`;

			console.error(msg, error);

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: msg,
			});
		} finally {
			setIsSharing(false);
		}
	};

	return (
		<li
			className="flex w-full items-center justify-between gap-4 p-2 hover:bg-button-hover rounded"
			key={user.id}
		>
			<div className="flex items-center gap-4">
				<Avatar className="rounded-sm">
					<AvatarImage src={user?.image_url ?? undefined} />

					<AvatarFallback className="rounded-sm bg-primary font-bold text-black">
						{nameOrEmail.slice(0, 2)}
					</AvatarFallback>
				</Avatar>

				<div className="flex flex-col items-start justify-center">
					<p className="font-bold">{nameOrEmail}</p>

					<p className="text-sm text-muted-foreground">
						{user.email.toLocaleLowerCase()}
					</p>
				</div>
			</div>

			{userAlreadyHasAccess ? (
				<Badge className="bg-accent text-white h-fit py-0 px-2 rounded-full font-normal text-sm">
					Shared
				</Badge>
			) : (
				<Button
					title={
						canUserChangePermissions
							? "Share this project with this user"
							: "You don't have permission to share this project"
					}
					disabled={
						updateNotebookMetadata.isPending || !canUserChangePermissions
					}
					variant={ButtonVariant.SUCCESS}
					onClick={handleShareWithUser}
					isLoading={isSharing}
					size="sm"
				>
					Shar{isSharing ? "ing..." : "e"}
				</Button>
			)}
		</li>
	);
}
