import { UserPlusIcon } from "lucide-react";
import { useState } from "react";

import { noop } from "#/helpers/utils";
import { useFetchOrganizationUsersPage } from "#/hooks/fetch/use-fetch-org-users-page";
import { useInviteUserToOrganizationMutation } from "#/hooks/mutation/use-invite-user-to-org";
import { useRemoveUserFromOrganizationMutation } from "#/hooks/mutation/use-remove-user-from-org";
import { useUpdateOrgMember } from "#/hooks/mutation/use-update-org-member";
import { useWithCurrentOrg } from "#/hooks/use-current-organization";
import {
  ORGANIZATION_MEMBER_ROLES,
  OrganizationMemberRole,
  type BetterbrainUser,
  type OrgMemberWithRole,
} from "#/types/notebook";
import { Avatar, AvatarFallback, AvatarImage } from "../Avatar";
import { Button, ButtonVariant, LOADER } from "../Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "../Dialog";
import { Input } from "../Input";
import { ToastAction } from "../Toast";
import { ToastVariant } from "../Toast/ToastVariant";
import { toast } from "../Toast/useToast";
import { getUserNameOrEmail } from "../layout/projects-helper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";
import { UserSearchInput } from "./user-search-input";

type Email = string;

enum Loading {
  SENDING_INVITE,
  REMOVING,
  ADDING,
  NONE,
}

export function ManageUsersModal() {
  const [memberToRemove, setMemberToRemove] = useState<BetterbrainUser>();
  const [emailToInvite, setEmailToInvite] = useState<Email | null>(null);
  const [shouldFetchOrgUsers, setShouldFetchOrgUsers] = useState(false);
  const [memberToAdd, setMemberToAdd] = useState<BetterbrainUser>();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [loading, setLoading] = useState(Loading.NONE);
  const [fullName, setFullName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const fetchOrgUsersPageQuery = useFetchOrganizationUsersPage(shouldFetchOrgUsers);
  const removeUserFromOrganizationMutation = useRemoveUserFromOrganizationMutation();
  const inviteUserToOrganizationMutation = useInviteUserToOrganizationMutation();
  const currentOrganization = useWithCurrentOrg();
  const updateOrgMember = useUpdateOrgMember();

  const isSendingInvite = loading === Loading.SENDING_INVITE;
  const isRemoving = loading === Loading.REMOVING;
  const isAdding = loading === Loading.ADDING;
  const isLoading = loading !== Loading.NONE;
  const orgId = currentOrganization?.id;

  const hasMoreUsersToLoad =
    currentOrganization &&
    currentOrganization.members.total > currentOrganization.members.users.length;

  async function handleRemoveMemberFromOrg() {
    if (isLoading) return;

    if (!orgId) {
      toast({
        variant: ToastVariant.Destructive,
        title: "Invalid organization",
      });

      return;
    }
    if (!memberToRemove) {
      toast({
        title: "Select a member to remove",
        variant: ToastVariant.Destructive,
      });

      return;
    }

    try {
      setLoading(Loading.REMOVING);

      await removeUserFromOrganizationMutation.mutateAsync({
        userId: `${memberToRemove.id}`,
        orgId: `${orgId}`,
      });

      setMemberToRemove(undefined);

      toast({
        variant: ToastVariant.Success,
        title: "Removal successfull",
      });
    } catch (error) {
      console.error("Error at handleRemoveMemberFromOrg:", error);

      toast({
        variant: ToastVariant.Destructive,
        title: "Removal unsuccessfull",
        action: (
          <ToastAction
            altText="Try again removing member from organization"
            onClick={handleRemoveMemberFromOrg}
          >
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setLoading(Loading.NONE);
    }
  }

  async function handleAddMemberToOrg() {
    if (isLoading) return;

    if (!memberToAdd) {
      toast({
        variant: ToastVariant.Destructive,
        title: "Select a member to add",
      });

      return;
    }

    try {
      setLoading(Loading.ADDING);

      await updateOrgMember.mutateAsync({
        userId: memberToAdd.id,
        orgId: orgId,
      });

      setMemberToAdd(undefined);
      setIsAddMemberOpen(false);
    } catch (error) {
      console.error(error);

      toast({
        title: "Could not add member to organization",
        variant: ToastVariant.Destructive,
        action: (
          <ToastAction
            altText="Try again adding member to organization"
            onClick={handleAddMemberToOrg}
          >
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setLoading(Loading.NONE);
    }
  }

  async function handleSendInvite() {
    if (isLoading || !emailToInvite) return;

    if (!orgId) {
      toast({
        variant: ToastVariant.Destructive,
        title: "Invalid organization",
      });

      return;
    }

    const fullNameTrimmed = fullName.trim();

    if (!fullNameTrimmed) {
      toast({
        title: "Full name should not be empty",
        variant: ToastVariant.Destructive,
      });

      return;
    }

    const [firstName, ...restOfName] = fullNameTrimmed.trim().split(" ");
    const lastName = restOfName.join(" ");

    try {
      setLoading(Loading.SENDING_INVITE);

      await inviteUserToOrganizationMutation.mutateAsync({
        email: emailToInvite.toLocaleLowerCase(),
        first_name: firstName ?? "",
        last_name: lastName,
        orgId,
      });

      setIsAddMemberOpen(false);
      setFullName("");
    } catch (error) {
      console.error(error);

      toast({
        title: "Could not add member to organization",
        variant: ToastVariant.Destructive,
        action: (
          <ToastAction
            altText="Try again adding member to organization"
            onClick={handleAddMemberToOrg}
          >
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setLoading(Loading.NONE);
    }
  }

  function handleLoadMoreUsers() {
    if (shouldFetchOrgUsers) {
      fetchOrgUsersPageQuery.fetchNextPage().catch(noop);
    } else {
      setShouldFetchOrgUsers(true);
    }
  }

  function handleChangeUserRole(newRole: OrganizationMemberRole, user: OrgMemberWithRole) {
    updateOrgMember.mutate({
      orgId: currentOrganization.id,
      userId: user.id,
      role: newRole,
    });
  }

  function mapToUserButton(user: OrgMemberWithRole) {
    const isOwner = user.id === currentOrganization?.owner?.id;
    const nameOrEmail = getUserNameOrEmail(user);
    const email = user.email.toLocaleLowerCase();

    return (
      <div
        className="mt-3 flex w-full items-center justify-start gap-4 rounded-sm p-2 hover:bg-link/5"
        key={user.id}
      >
        <Avatar className="rounded-sm">
          <AvatarImage src={user?.image_url ?? undefined} />

          <AvatarFallback className="rounded-sm bg-primary font-bold text-secondary">
            {nameOrEmail.slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="flex w-full justify-between max-w-full gap-3">
          <div className="grid grid-rows-2 items-start justify-center max-w-full">
            <p className="font-bold">{nameOrEmail}</p>

            <p className="text-sm text-muted-foreground truncate max-w-full" title={email}>
              {email}
            </p>
          </div>

          <div className="flex gap-3 items-center justify-end">
            <Select
              onValueChange={(newRole) =>
                handleChangeUserRole(newRole as OrganizationMemberRole, user)
              }
              defaultValue={user.role}
            >
              <SelectTrigger
                className="w-fit gap-2 text-xs bg-badge-orange text-badge-orange-foreground capitalize border-none py-0.5 px-2 button-hover h-10 shadow-xs shadow-black/20"
                iconClassName="text-badge-orange-foreground"
                title="Change user type"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {ORGANIZATION_MEMBER_ROLES.map((role) => (
                  <SelectItem className="capitalize" key={role} value={role}>
                    {role.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isOwner ? (
              <p className="text-sm text-link text-right">Owner</p>
            ) : (
              <button
                className="text-sm text-destructive hover:underline text-right"
                onPointerUp={() => setMemberToRemove(user)}
                type="button"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogOverlay />

        <DialogTrigger className="flex w-full gap-2 items-center justify-center rounded-[5px] p-2 button-hover text-xs">
          <UserPlusIcon className="size-4 stroke-1" />

          <span>Manage users</span>
        </DialogTrigger>

        {isOpen ? (
          <DialogContent className="flex h-[80vh] max-w-3xl flex-col gap-5 overflow-auto">
            <DialogHeader>
              <DialogTitle className="mb-6 w-full tracking-wider">
                Manage users of
                <span className="ml-2 font-light italic">#{currentOrganization?.name}</span>
              </DialogTitle>

              <DialogDescription>
                Make changes to your organization&apos;s users here.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex flex-col">
              <h6 className="font-bold tabular-nums">
                Members{" "}
                <span className="text-sm font-light">
                  {currentOrganization?.members?.total || 0}
                </span>
              </h6>

              <Dialog onOpenChange={setIsAddMemberOpen} open={isAddMemberOpen}>
                <DialogOverlay />

                <DialogTrigger className="mt-3 flex w-full items-center justify-start gap-4 rounded-sm p-2 hover:bg-link/20">
                  <div className="relative h-10 w-10 overflow-hidden rounded-sm dark:bg-gray-600">
                    <svg
                      className="absolute -left-1 h-12 w-12 text-primary"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>

                  <p className="font-bold">Add people</p>
                </DialogTrigger>

                <hr className="mt-3 w-full border-slate-400" />

                <DialogContent className="max-w-xl h-[60vh] flex flex-col justify-between simple-scrollbar">
                  <div className="flex flex-col gap-10">
                    <DialogTitle className="flex items-center justify-start text-xl font-bold">
                      Add people to <span className="ml-1.5 font-light">#</span>
                      {currentOrganization?.name}
                    </DialogTitle>

                    <UserSearchInput
                      setEmailToInvite={setEmailToInvite}
                      setMemberToAdd={setMemberToAdd}
                      memberToAdd={memberToAdd}
                    />

                    {emailToInvite ? (
                      <label className="flex flex-col gap-2">
                        <span className="text-sm text-primary">
                          Type the user&apos;s full name in order to invite them:
                        </span>

                        <Input
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="New member's full name"
                          value={fullName}
                          required
                          min={1}
                        />
                      </label>
                    ) : null}
                  </div>

                  <DialogFooter>
                    {emailToInvite ? (
                      <Button
                        onPointerUp={handleSendInvite}
                        variant={ButtonVariant.PURPLE}
                        isLoading={isSendingInvite}
                        disabled={isLoading}
                      >
                        Send{isSendingInvite ? "ing" : ""} invite by email
                        {isSendingInvite ? "..." : ""}
                      </Button>
                    ) : (
                      <Button
                        disabled={Boolean(emailToInvite) || !memberToAdd || isLoading}
                        onPointerUp={handleAddMemberToOrg}
                        variant={ButtonVariant.PURPLE}
                        isLoading={isAdding}
                      >
                        Add{isAdding ? "ing..." : ""}
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <ul>
                {currentOrganization?.members?.users.map(mapToUserButton)}

                <div className="w-full flex items-center justify-center mt-3.5">
                  <button
                    className="disabled:opacity-50 p-2 text-xs not-disabled:link not-disabled:hover:underline flex gap-2 items-center disabled:pointer-events-none"
                    disabled={!hasMoreUsersToLoad}
                    onClick={handleLoadMoreUsers}
                  >
                    {fetchOrgUsersPageQuery.fetchStatus === "fetching" ? (
                      <>
                        {LOADER}

                        <span>Loading more users...</span>
                      </>
                    ) : hasMoreUsersToLoad ? (
                      "Load more users"
                    ) : (
                      "No more users to load"
                    )}
                  </button>
                </div>
              </ul>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      {memberToRemove ? (
        <Dialog onOpenChange={(newIsOpen) => !newIsOpen && setMemberToRemove(undefined)} open>
          <DialogContent className="gap-10">
            <h4 className="w-full text-center text-xl font-bold tracking-wide">
              Confirm removal from organization
            </h4>

            <p className="inline">
              Are you sure you want to remove{" "}
              <span className="font-bold underline">{getUserNameOrEmail(memberToRemove)}</span>{" "}
              from&nbsp;
              <span className="inline font-light italic">{currentOrganization?.name} </span>?
            </p>

            <Button
              onPointerUp={handleRemoveMemberFromOrg}
              variant={ButtonVariant.DESTRUCTIVE}
              aria-disabled={isLoading}
              isLoading={isRemoving}
              type="submit"
            >
              Remov{isAdding ? "ing..." : "e"}
            </Button>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
