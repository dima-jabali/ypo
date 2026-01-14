import { useRef, useState } from "react";

import { authStore } from "#/contexts/auth/auth";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { CreateNewOrganizationModal } from "#/features/assign-to/create-new-organization-modal";
import {
	fileToBase64,
	getIsRunningInIframe,
	isDev,
	noop,
	preventDefault,
} from "#/helpers/utils";
import {
	useFetchAllOrganizations,
	userRoleInOrg,
	useUserRoleInCurrOrg,
	type AwsBucket,
	type AwsKey,
	type Organization,
} from "#/hooks/fetch/use-fetch-all-organizations";
import { useFetchBetterbrainUser } from "#/hooks/fetch/use-fetch-betterbrain-user";
import { useAwsBase64File } from "#/hooks/mutation/use-aws-base64-file";
import { useDeleteAwsFile } from "#/hooks/mutation/use-delete-aws-file";
import { useMutateOrganization } from "#/hooks/mutation/use-mutate-organization";
import { useUploadToAws } from "#/hooks/mutation/use-upload-to-aws";
import { queryKeyFactory } from "#/hooks/query-keys";
import { useWithCurrentOrg } from "#/hooks/use-current-organization";
import { useFileUpload } from "#/hooks/use-file-upload";
import { ColorScheme } from "#/types/general";
import { OrganizationMemberRole } from "#/types/notebook";
import { useQueryClient } from "@tanstack/react-query";
import {
	Check,
	ChevronDownIcon,
	FileImage,
	Pencil,
	PlusIcon,
} from "lucide-react";
import { AwsBase64File } from "./aws-base64-file";
import { BrieflyKeepSidebarOpen } from "./briefly-keep-sidebar-open";
import { Button, ButtonVariant } from "./Button";
import { Checkbox } from "./Checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./Dialog";
import { Input } from "./Input";
import { ManageUsersModal } from "./manage-users-modal/manage-users-modal";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

function scrollActiveItemIntoView(
	ref: HTMLButtonElement | null,
	isActive: boolean,
) {
	if (ref && isActive) {
		ref.scrollIntoView({ behavior: "instant", block: "center" });
	}
}

export function SetCurrentOrganizationPopover() {
	const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const showCreateNewOrganizationToAdminsInIframe =
		generalContextStore.use.showCreateNewOrganizationToAdminsInIframe();
	const showCreateNewOrganizationToUsersInIframe =
		generalContextStore.use.showCreateNewOrganizationToUsersInIframe();
	const showCreateNewOrganizationToUsersInBb =
		generalContextStore.use.showCreateNewOrganizationToUsersInBb();
	const showManageUsersToAdminsInIframe =
		generalContextStore.use.showManageUsersToAdminsInIframe();
	const showManageUsersToUsersInIframe =
		generalContextStore.use.showManageUsersToUsersInIframe();
	const showManageUsersToUsersInBb =
		generalContextStore.use.showManageUsersToUsersInBb();
	const colorScheme = generalContextStore.use.colorScheme();
	const clerkApiToken = authStore.use.clerkApiToken();
	const currentOrganization = useWithCurrentOrg();
	const allOrgs = useFetchAllOrganizations();
	const userRole = useUserRoleInCurrOrg();
	const user = useFetchBetterbrainUser();

	function handleSetCurrentOrganization(org: Organization) {
		if (currentOrganization.id === org.id) {
			setIsOpen(false);

			return;
		}

		generalContextStore.setState({
			botConversationId: null,
			organizationId: org.id,
			batchTableId: null,
			notebookId: null,
		});

		setIsOpen(false);
	}

	const isInsideIframe = getIsRunningInIframe() && !clerkApiToken;
	const isUserRegular = userRole === OrganizationMemberRole.User;
	const isUserAdmin = userRole === OrganizationMemberRole.Admin;

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<BrieflyKeepSidebarOpen value={isOpen} onlyIfOrgSelectorIsOnSidebar />

			<PopoverTrigger>
				<Tooltip>
					<TooltipTrigger
						className="relative flex max-w-[180px] flex-nowrap items-center justify-between gap-2 truncate rounded-lg border border-border-smooth px-2 py-1 text-xs button-hover data-[state=open]:bg-button-hover data-[state=open]:text-primary group"
						data-is-dark={colorScheme === ColorScheme.dark}
						onClick={() => setIsOpen((prev) => !prev)}
						title="Set current organization"
					>
						{currentOrganization.show_logo &&
						currentOrganization.logo_s3_bucket &&
						currentOrganization.logo_s3_key ? (
							<AwsBase64File
								className="w-auto h-5 rounded-none object-cover"
								aws_bucket={currentOrganization.logo_s3_bucket}
								aws_key={currentOrganization.logo_s3_key}
								fallback={null}
							/>
						) : null}

						<p className="truncate whitespace-nowrap">
							{currentOrganization.name}
						</p>

						<ChevronDownIcon className="size-4 flex-none" />
					</TooltipTrigger>

					<TooltipContent
						className="w-fit max-h-28 simple-scrollbar text-primary text-xs"
						align="center"
						side="right"
					>
						Set current organization
					</TooltipContent>
				</Tooltip>
			</PopoverTrigger>

			{isOpen ? (
				<PopoverContent
					className="flex max-h-96 min-w-[var(--radix-popover-trigger-width)] max-w-xl flex-col gap-1 overflow-auto rounded-lg"
					onOpenAutoFocus={preventDefault}
					sideOffset={5}
					align="start"
					side="right"
				>
					<div className="flex flex-col gap-1 overflow-hidden">
						<ol className="flex w-full flex-col simple-scrollbar m-0! gap-1! text-sm">
							{allOrgs.map((org) => {
								const isUserAdminOnThisOrg =
									userRoleInOrg(org, user.id) === OrganizationMemberRole.Admin;
								const isActive = org.id === currentOrganization.id;

								return (
									<div
										className="flex w-full items-center gap-2 rounded-[5px] transition-none data-[is-active=true]:bg-button-hover hover:bg-button-hover"
										title={`${org.name} (${org.id})`}
										data-is-active={isActive}
										key={org.id}
									>
										<button
											ref={(ref) => scrollActiveItemIntoView(ref, isActive)}
											onClick={() => handleSetCurrentOrganization(org)}
											className="flex items-center gap-2 p-2 w-full"
										>
											{org.logo_s3_bucket && org.logo_s3_key ? (
												<AwsBase64File
													className="w-auto h-5 rounded-none object-cover"
													aws_bucket={org.logo_s3_bucket}
													aws_key={org.logo_s3_key}
													fallback={null}
												/>
											) : null}

											<span className="truncate" title="Organization's name">
												{org.name}
											</span>

											<span
												className="text-xs text-muted"
												title="Organization's ID"
											>
												({org.id})
											</span>
										</button>

										<div className="flex items-center gap-0">
											{isUserAdminOnThisOrg ? (
												<MutateOrganizationDialog org={org} />
											) : null}

											{isActive ? (
												<div className="rounded-md h-8 aspect-square flex items-center justify-center">
													<Check className="size-5 stroke-1 text-primary flex-none" />
												</div>
											) : null}
										</div>
									</div>
								);
							})}

							{allOrgs.length === 0 ? (
								<div className="flex w-full h-10 items-center justify-center">
									No organizations found!
								</div>
							) : null}
						</ol>

						{isCreateOrgModalOpen ? (
							<CreateNewOrganizationModal setIsOpen={setIsCreateOrgModalOpen} />
						) : null}

						<div className="flex gap-1 border-t border-t-border-smooth pt-1 empty:hidden">
							{isInsideIframe ? (
								<>
									{(isUserRegular && showManageUsersToUsersInIframe) ||
									(showManageUsersToAdminsInIframe && isUserAdmin) ? (
										<>
											<ManageUsersModal key={currentOrganization.id} />

											<div className="border-border-smooth border-0 border-r [writing-mode:vertical-lr] last:hidden"></div>
										</>
									) : null}

									{(isUserRegular &&
										showCreateNewOrganizationToUsersInIframe) ||
									(showCreateNewOrganizationToAdminsInIframe && isUserAdmin) ? (
										<button
											className="flex w-full gap-2 items-center justify-center rounded-[5px] p-2 button-hover text-xs"
											onPointerUp={() => setIsCreateOrgModalOpen(true)}
											title="Create new organization"
										>
											<PlusIcon className="size-5 stroke-primary stroke-1" />

											<span className="whitespace-nowrap">
												Create new organization
											</span>
										</button>
									) : null}
								</>
							) : (
								<>
									{(showManageUsersToUsersInBb && isUserRegular) ||
									isUserAdmin ? (
										<>
											<ManageUsersModal key={currentOrganization.id} />

											<div className="border-border-smooth border-0 border-r [writing-mode:vertical-lr]"></div>
										</>
									) : null}

									{(isUserRegular && showCreateNewOrganizationToUsersInBb) ||
									isUserAdmin ? (
										<button
											className="flex w-full gap-2 items-center justify-center rounded-[5px] p-2 button-hover text-xs"
											onPointerUp={() => setIsCreateOrgModalOpen(true)}
											title="Create new organization"
										>
											<PlusIcon className="size-5 stroke-primary stroke-1" />

											<span className="whitespace-nowrap">
												Create new organization
											</span>
										</button>
									) : null}
								</>
							)}
						</div>
					</div>
				</PopoverContent>
			) : null}
		</Popover>
	);
}

SetCurrentOrganizationPopover.whyDidYouRender = true;

function MutateOrganizationDialog({ org }: { org: Organization }) {
	const [isOpen, setIsOpen] = useState(false);

	const awsBase64LogoFileQuery = useAwsBase64File({
		aws_bucket: org.logo_s3_bucket,
		aws_key: org.logo_s3_key,
	});
	const awsBase64WhitelabelFileQuery = useAwsBase64File({
		aws_bucket: org.whitelabel_s3_bucket,
		aws_key: org.whitelabel_s3_key,
	});

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger
				className="button-hover rounded-md h-8 aspect-square flex items-center justify-center"
				title="Edit organization"
			>
				<Pencil className="size-4 stroke-1 flex-none" />
			</DialogTrigger>

			{isOpen ? (
				<MutateOrganizationDialogContent
					key={`${awsBase64WhitelabelFileQuery.dataUpdatedAt}-${awsBase64LogoFileQuery.dataUpdatedAt}`}
					setIsOpen={setIsOpen}
					org={org}
				/>
			) : null}
		</Dialog>
	);
}

function MutateOrganizationDialogContent({
	org,
	setIsOpen,
}: {
	org: Organization;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const awsBase64LogoFileQuery = useAwsBase64File({
		aws_bucket: org.logo_s3_bucket,
		aws_key: org.logo_s3_key,
	});
	const awsBase64WhitelabelFileQuery = useAwsBase64File({
		aws_bucket: org.whitelabel_s3_bucket,
		aws_key: org.whitelabel_s3_key,
	});
	const mutateOrganization = useMutateOrganization();
	const deleteAwsFile = useDeleteAwsFile();
	const uploadToAws = useUploadToAws();
	const queryClient = useQueryClient();

	const [
		{ files: logoFiles },
		{
			openFileDialog: openLogoFileDialog,
			getInputProps: getLogoInputProps,
			removeFile: removeLogoFile,
		},
	] = useFileUpload({
		initialFiles:
			awsBase64LogoFileQuery.data &&
			typeof awsBase64LogoFileQuery.data === "string"
				? [
						{
							type: awsBase64LogoFileQuery.data.slice(
								5,
								awsBase64LogoFileQuery.data.indexOf(";"),
							),
							size: awsBase64LogoFileQuery.data.length,
							url: awsBase64LogoFileQuery.data,
							id: `existing-logo-${org.id}`,
							name: `${org.name}'s logo`,
						},
					]
				: [],
		maxSize: 3 * 1024 * 1024, // 3 MB
		accept: "image/*",
		multiple: false,
	});

	const [
		{ files: whitelabelFiles },
		{
			openFileDialog: openWhitelabelFileDialog,
			getInputProps: getWhitelabelInputProps,
			removeFile: removeWhitelabelFile,
		},
	] = useFileUpload({
		initialFiles:
			awsBase64WhitelabelFileQuery.data &&
			typeof awsBase64WhitelabelFileQuery.data === "string"
				? [
						{
							type: awsBase64WhitelabelFileQuery.data.slice(
								5,
								awsBase64WhitelabelFileQuery.data.indexOf(";"),
							),
							size: awsBase64WhitelabelFileQuery.data.length,
							url: awsBase64WhitelabelFileQuery.data,
							name: `${org.name}'s whitelabel logo`,
							id: `existing-logo-${org.id}`,
						},
					]
				: [],
		maxSize: 3 * 1024 * 1024, // 3 MB
		accept: "image/*",
		multiple: false,
	});

	const whitelabelPreviewUrl = whitelabelFiles[0]?.preview || null;
	const whitelabelFileName = whitelabelFiles[0]?.file.name || null;
	const logoPreviewUrl = logoFiles[0]?.preview || null;
	const logoFileName = logoFiles[0]?.file.name || null;

	const changesRef = useRef({ ...org });

	async function handleMutateOrganization() {
		function invalidateAwsImg(awsBucket: AwsBucket, awsKey: AwsKey) {
			queryClient
				.invalidateQueries({
					queryKey: [
						...queryKeyFactory.get["aws-base64-file"].queryKey,
						awsBucket,
						awsKey,
					],
				})
				.catch(noop);
		}

		try {
			const logoFile = logoFiles[0];
			const isExistingLogoFile =
				logoFile && logoFile.id === `existing-logo-${org.id}`;

			console.log({ isExistingLogoFile });

			let logoAwsBucket: AwsBucket | null =
				org.logo_s3_bucket || ("betterbrain-customers-prod" as AwsBucket);
			let logoAwsKey: AwsKey | null =
				org.logo_s3_key ||
				(`${isDev ? "development" : "production"}/organizations/${org.id}/logo` as AwsKey);

			if (isExistingLogoFile) {
				// do nothing
			} else if (logoFile && logoFile.file instanceof File) {
				// New file

				await uploadToAws.mutateAsync({
					fileBase64: await fileToBase64(logoFile.file),
					fileMimeType: logoFile.file.type,
					aws_bucket: logoAwsBucket,
					aws_key: logoAwsKey,
				});

				invalidateAwsImg(logoAwsBucket, logoAwsKey);
			} else {
				// Delete file

				await deleteAwsFile.mutateAsync({
					aws_bucket: logoAwsBucket,
					aws_key: logoAwsKey,
				});

				invalidateAwsImg(logoAwsBucket, logoAwsKey);

				logoAwsBucket = null;
				logoAwsKey = null;
			}

			const whitelabelFile = whitelabelFiles[0];
			const isExistingWhitelabelFile =
				whitelabelFile && whitelabelFile.id === `existing-logo-${org.id}`;

			let whitelabelAwsBucket: AwsBucket | null =
				org.whitelabel_s3_bucket || ("betterbrain-customers-prod" as AwsBucket);
			let whitelabelAwsKey: AwsKey | null =
				org.whitelabel_s3_key ||
				(`${isDev ? "development" : "production"}/organizations/${org.id}/whitelabel-logo` as AwsKey);

			console.log({ isExistingLogoFile, isExistingWhitelabelFile });

			if (isExistingWhitelabelFile) {
				// do nothing
			} else if (whitelabelFile && whitelabelFile.file instanceof File) {
				// New file

				await uploadToAws.mutateAsync({
					fileBase64: await fileToBase64(whitelabelFile.file),
					fileMimeType: whitelabelFile.file.type,
					aws_bucket: whitelabelAwsBucket,
					aws_key: whitelabelAwsKey,
				});

				invalidateAwsImg(whitelabelAwsBucket, whitelabelAwsKey);
			} else {
				// Delete file

				await deleteAwsFile.mutateAsync({
					aws_bucket: whitelabelAwsBucket,
					aws_key: whitelabelAwsKey,
				});

				invalidateAwsImg(whitelabelAwsBucket, whitelabelAwsKey);

				whitelabelAwsBucket = null;
				whitelabelAwsKey = null;
			}

			await mutateOrganization.mutateAsync({
				body: {
					use_whitelabel_image: changesRef.current.use_whitelabel_image,
					whitelabel_name: changesRef.current.whitelabel_name,
					whitelabel_s3_bucket: whitelabelAwsBucket,
					show_logo: changesRef.current.show_logo,
					whitelabel_s3_key: whitelabelAwsKey,
					name: changesRef.current.name,
					logo_s3_bucket: logoAwsBucket,
					logo_s3_key: logoAwsKey,
				},
				pathParams: {
					organizationId: org.id,
				},
			});

			setIsOpen(false);
		} catch {
			// do nothing
		}
	}

	return (
		<DialogContent className="max-h-[90vh] simple-scrollbar">
			<DialogHeader>
				<DialogTitle>Change organization&apos;s metadata</DialogTitle>

				<DialogDescription></DialogDescription>
			</DialogHeader>

			<fieldset>
				<label className="font-semibold text-sm" htmlFor="name">
					Name
				</label>

				<Input
					onChange={(e) => (changesRef.current.name = e.target.value)}
					defaultValue={org.name}
				/>
			</fieldset>

			<fieldset>
				<label className="font-semibold text-sm" htmlFor="name">
					White label name
				</label>

				<Input
					onChange={(e) =>
						(changesRef.current.whitelabel_name = e.target.value)
					}
					defaultValue={org.whitelabel_name}
				/>
			</fieldset>

			<fieldset>
				<label className="font-semibold text-sm" htmlFor="name">
					Logo
				</label>

				<div className="flex flex-col gap-2">
					<div className="inline-flex items-center gap-2 align-top">
						<div
							className="relative flex min-h-10 min-w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-smooth"
							aria-label={logoPreviewUrl ? "Upload preview" : ""}
						>
							{logoPreviewUrl ? (
								<img
									className="h-10 w-auto object-cover"
									alt="Upload preview"
									src={logoPreviewUrl}
									height={32}
									width={32}
								/>
							) : (
								<div aria-hidden="true">
									<FileImage className="opacity-60" size={16} />
								</div>
							)}
						</div>

						<div className="relative inline-block">
							<Button aria-haspopup="dialog" onClick={openLogoFileDialog}>
								{logoFileName ? "Change image" : "Upload image"}
							</Button>

							<input
								{...getLogoInputProps()}
								aria-label="Upload image file"
								className="sr-only"
								tabIndex={-1}
							/>
						</div>
					</div>

					{logoFileName && (
						<div className="inline-flex gap-2 text-xs">
							<p aria-live="polite" className="truncate text-muted-foreground">
								{logoFileName}
							</p>{" "}
							<button
								className="font-medium text-destructive hover:underline"
								onClick={() => removeLogoFile(logoFiles[0]?.id)}
								aria-label={`Remove ${logoFileName}`}
								type="button"
							>
								Remove
							</button>
						</div>
					)}
				</div>
			</fieldset>

			<fieldset>
				<label className="font-semibold text-sm" htmlFor="name">
					White Label Image
				</label>

				<div className="flex flex-col gap-2">
					<div className="inline-flex items-center gap-2 align-top">
						<div
							className="relative flex min-h-10 min-w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-smooth"
							aria-label={whitelabelPreviewUrl ? "Upload preview" : ""}
						>
							{whitelabelPreviewUrl ? (
								<img
									className="h-10 w-auto object-cover"
									src={whitelabelPreviewUrl}
									alt="Upload preview"
									height={32}
									width={32}
								/>
							) : (
								<div aria-hidden="true">
									<FileImage className="opacity-60" size={16} />
								</div>
							)}
						</div>

						<div className="relative inline-block">
							<Button aria-haspopup="dialog" onClick={openWhitelabelFileDialog}>
								{whitelabelFileName ? "Change image" : "Upload image"}
							</Button>

							<input
								{...getWhitelabelInputProps()}
								aria-label="Upload image file"
								className="sr-only"
								tabIndex={-1}
							/>
						</div>
					</div>

					{whitelabelFileName && (
						<div className="inline-flex gap-2 text-xs">
							<p aria-live="polite" className="truncate text-muted-foreground">
								{whitelabelFileName}
							</p>{" "}
							<button
								className="font-medium text-destructive hover:underline"
								onClick={() => removeWhitelabelFile(whitelabelFiles[0]?.id)}
								aria-label={`Remove ${whitelabelFileName}`}
								type="button"
							>
								Remove
							</button>
						</div>
					)}
				</div>
			</fieldset>

			<fieldset className="flex items-center justify-center gap-2 w-fit">
				<Checkbox
					onCheckedChange={(checked) => {
						changesRef.current.use_whitelabel_image =
							checked.valueOf() as boolean;
					}}
					defaultChecked={org.use_whitelabel_image}
					id="use-whitelabel-image"
				/>

				<label className="text-sm" htmlFor="use-whitelabel-image">
					Use white label image
				</label>
			</fieldset>

			<fieldset className="flex items-center justify-center gap-2 w-fit">
				<Checkbox
					onCheckedChange={(checked) => {
						changesRef.current.show_logo = checked.valueOf() as boolean;
					}}
					defaultChecked={org.show_logo}
					id="show-logo"
				/>

				<label className="text-sm" htmlFor="show-logo">
					Show logo
				</label>
			</fieldset>

			<DialogFooter>
				<Button
					isLoading={
						mutateOrganization.isPending ||
						deleteAwsFile.isPending ||
						uploadToAws.isPending
					}
					onClick={handleMutateOrganization}
					variant={ButtonVariant.SUCCESS}
				>
					Sav
					{mutateOrganization.isPending ||
					uploadToAws.isPending ||
					deleteAwsFile.isPending
						? "ing..."
						: "e"}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
