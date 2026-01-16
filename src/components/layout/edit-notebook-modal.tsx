/* eslint-disable react-refresh/only-export-components */

import { Ellipsis } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/Dialog";
import {
  getImportanceEnum,
  getImportanceTagTheme,
  getStatusEnum,
  getUserNameOrEmail,
} from "#/components/layout/projects-helper";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { BaseProjectForm } from "#/features/assign-to/base-project-form/base-project-form";
import {
  type UpdateNotebookRequestBody,
  useUpdateNotebookMetadata,
} from "#/hooks/mutation/use-update-notebook-metadata";
import { useCurrentOrganization } from "#/hooks/use-current-organization";
import {
  type BetterbrainUser,
  type NotebookAssignee,
  NotebookImportance,
  type NotebookMetadata,
  NotebookStatus,
  type NotebookTag,
} from "#/types/notebook";
import { noop } from "#/helpers/utils";

interface Props {
  allTags: Array<NotebookTag> | null;
  notebook: NotebookMetadata;
  chatMode?: boolean;
}

type ValidateProps = {
  title?: string;
};

export type ProjectAssigneeForMultiSelect = NotebookAssignee & {
  color: string;
  name: string;
  id: string;
};

const isInfoValid = <T extends ValidateProps>(info?: T) => {
  let isValid = true;

  if (!info) {
    toast({
      title: "Make sure to fill all required fields",
      variant: ToastVariant.Destructive,
    });

    isValid = false;
  }

  const title = (info?.title ?? "").trim();

  if (!title) {
    toast({
      description: "Please enter a title",
      variant: ToastVariant.Destructive,
      title: "Title is required",
    });

    isValid = false;
  } else if (title.length > MAX_TITLE_LENGTH) {
    toast({
      description: `Title can have at most ${MAX_TITLE_LENGTH} characters`,
      variant: ToastVariant.Destructive,
      title: "Title is too long",
    });

    isValid = false;
  }

  return isValid;
};

const getFormData = (formRef: React.RefObject<HTMLFormElement | null>) => {
  if (!formRef.current) return;

  const formData = new FormData(formRef.current);

  const data: Record<string, string> = {};

  for (const [key, value] of formData) {
    // @ts-expect-error => We're not sending any files.
    data[key] = value;
  }

  return data as UpdateNotebookRequestBody;
};

export const mapPriority = (priority: NotebookImportance) => ({
  color: getImportanceTagTheme(priority),
  name: getImportanceEnum(priority),
  id: getImportanceEnum(priority),
});

export const mapStatus = (status: NotebookStatus) => ({
  name: getStatusEnum(status),
  id: getStatusEnum(status),
  color: "",
});

const mapAssignedTo = (
  projectAssignees: Array<NotebookAssignee>,
): Array<ProjectAssigneeForMultiSelect> =>
  projectAssignees.map((projectAssignee) => ({
    name: getUserNameOrEmail(projectAssignee.user),
    id: `${projectAssignee.user.id}`,
    user: projectAssignee.user,
    is_owner: false,
    color: "",
  }));

export const mapUsers = (users: Array<BetterbrainUser>): ProjectAssigneeForMultiSelect[] =>
  users.map((user) => ({
    name: getUserNameOrEmail(user),
    id: `${user.id}`,
    is_owner: false,
    color: "",
    user,
  }));

const mapTagIds = (
  tagIds: Array<number> | Array<NotebookTag>,
  allTags: Array<NotebookTag>,
): Array<NotebookTag> =>
  typeof tagIds[0] === "number"
    ? allTags.filter((tag) => tagIds.find((tagId) => tagId === tag.id))
    : (tagIds as Array<NotebookTag>);

export const PRIORITY_OPTIONS = Object.values(NotebookImportance).map(mapPriority);

export const STATUS_OPTIONS = Object.values(NotebookStatus).map(mapStatus);

export const MAX_TAG_NAME_LENGTH = 20;
export const MAX_TITLE_LENGTH = 100;

export const EditNotebookModal = memo(function EditNotebookModal({
  chatMode = false,
  notebook,
  allTags,
}: Props) {
  const currentOrganization = useCurrentOrganization();

  const [priority, setPriority] = useState([mapPriority(notebook.priority as NotebookImportance)]);
  const [status, setStatus] = useState([mapStatus(notebook.status as NotebookStatus)]);
  const [assignTo, setAssignTo] = useState(mapAssignedTo(notebook.assigned_to ?? []));
  const [selectedTags, setSelectedTags] = useState(mapTagIds(notebook.tags, allTags || []));

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  const updateNotebook = useUpdateNotebookMetadata();

  const isLoading = isArchiving || isSaving;

  useEffect(() => {
    setPriority([mapPriority(notebook.priority as NotebookImportance)]);
    setStatus([mapStatus(notebook.status as NotebookStatus)]);
    // setSelectedTags(mapTagIds(project.tags, allTags || []));
    setAssignTo(mapAssignedTo(notebook.assigned_to ?? []));
  }, [
    notebook.assigned_to,
    notebook.priority,
    notebook.status,
    // notebook.tags,
    // allTags,
  ]);

  async function handleSave() {
    if (isLoading) return;

    setIsSaving(true);

    try {
      const body = getFormData(formRef) as UpdateNotebookRequestBody;

      if (!isInfoValid(body)) return;

      body.priority = priority[0]?.name || NotebookImportance.Low;
      body.status = status[0]?.name || NotebookStatus.NotStarted;
      body.tags = selectedTags.map((tag) => tag.id);
      body.assigned_to = assignTo.map((assignTo) => ({
        is_owner: assignTo.is_owner || assignTo.user.id === notebook.created_by.id,
        user: assignTo.user,
      }));

      await updateNotebook.mutateAsync({
        notebookId: notebook.id,
        ...body,
      });

      setIsOpen(false);

      toast({
        title: "Project updated successfully",
        variant: ToastVariant.Success,
      });
    } catch (error) {
      console.error(error);

      toast({
        variant: ToastVariant.Destructive,
        title: "Error updating project",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive() {
    if (isLoading) return;

    setIsArchiving(true);

    try {
      await updateNotebook.mutateAsync({
        archived: !notebook.archived,
        notebookId: notebook.id,
      });

      setIsOpen(false);

      toast({
        title: `Project ${notebook.archived ? "un" : ""}archived successfully`,
        variant: ToastVariant.Success,
      });
    } catch (error) {
      console.error(error);

      toast({
        variant: ToastVariant.Destructive,
        title: "Error archiving project",
      });
    } finally {
      setIsArchiving(false);
    }
  }

  function handleConfirm(isConfirmed: boolean) {
    setIsConfirmOpen(false);

    if (isConfirmed) {
      handleArchive().catch(noop);
    }
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      {chatMode ? (
        <DialogTrigger
          className="button-hover h-full aspect-square flex items-center justify-center rounded-lg group cursor-pointer"
          title="Edit project"
        >
          <Ellipsis className="size-5 text-primary group-hover:text-primary" />
        </DialogTrigger>
      ) : (
        <DialogTrigger className="ignore-table-row-click mx-auto flex items-center justify-center gap-1 rounded-[8px] border border-accent px-3 py-1 hover:bg-accent active:brightness-150 hover:text-white">
          Edit
        </DialogTrigger>
      )}

      {isOpen && currentOrganization ? (
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit project</DialogTitle>

            <DialogDescription>Change project metadata.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col overflow-auto">
            <BaseProjectForm
              users={mapUsers(currentOrganization.members.users)}
              setSelectedTags={setSelectedTags}
              selectedTags={selectedTags}
              setPriority={setPriority}
              setAssignTo={setAssignTo}
              onSubmit={handleSave}
              setStatus={setStatus}
              priority={priority}
              assignTo={assignTo}
              project={notebook}
              status={status}
              tags={allTags}
              ref={formRef}
            >
              <DialogFooter className="flex w-full justify-between">
                <Dialog onOpenChange={setIsConfirmOpen} open={isConfirmOpen}>
                  <DialogTrigger asChild>
                    <Button
                      title={`${notebook.archived ? "Una" : "A"}rchive project`}
                      aria-disabled={isLoading || isArchiving}
                      variant={ButtonVariant.OUTLINE}
                      isLoading={isArchiving}
                    >
                      {notebook.archived ? "Una" : "A"}rchiv
                      {isArchiving ? "ing..." : "e"}
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogTitle className="text-xl font-bold">
                      Confirm project archivation
                    </DialogTitle>

                    <DialogDescription className="text-base text-primary">
                      Are you sure you want to {notebook.archived ? "un" : ""}
                      archive the project &quot;
                      <span className="font-bold">{notebook.title}</span>
                      &quot;? If you made changes, save them first, then archive.
                    </DialogDescription>

                    <DialogFooter>
                      <Button
                        onPointerUp={() => handleConfirm(false)}
                        variant={ButtonVariant.DESTRUCTIVE}
                        title="Do not archive project"
                      >
                        Cancel
                      </Button>

                      <Button
                        onPointerUp={() => handleConfirm(true)}
                        title="Confirm and archive project"
                        variant={ButtonVariant.SUCCESS}
                      >
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  aria-disabled={isSaving || isLoading}
                  variant={ButtonVariant.SUCCESS}
                  onPointerUp={handleSave}
                  title="Save changes"
                  isLoading={isSaving}
                  type="button"
                >
                  Sav{isSaving ? "ing..." : "e"}
                </Button>
              </DialogFooter>
            </BaseProjectForm>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
});
