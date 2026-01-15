import { Info, Plus, Settings } from "lucide-react";
import { memo, useReducer } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import { EmptyFallbackSuspense } from "#/components/empty-fallback-suspense";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { useWithOrganizationId } from "#/contexts/general-ctx/general-context";
import { createISODate } from "#/helpers/utils";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";
import { useFetchBotPlan } from "#/hooks/fetch/use-fetch-bot-plan";
import { useDownloadedNotebookId } from "#/hooks/fetch/use-fetch-notebook";
import { useApproveBotPlan } from "#/hooks/mutation/use-approve-bot-plan";
import { useDeleteBotPlan } from "#/hooks/mutation/use-delete-bot-plan";
import {
	useEditBotPlan,
	type EditBotPlanRequestProps,
} from "#/hooks/mutation/use-edit-bot-plan";
import {
	PlanApprovalStatus,
	type BotPlanStepId,
	type PlanStep,
} from "#/types/chat";
import { Task } from "./Task";
import { TasksProvider, useTasks } from "./useTasksContext";

function hasAnyActivePlan(tasks: PlanStep[]) {
	for (const task of tasks) {
		if (task.is_active) return true;

		if (
			task.sub_tasks &&
			task.sub_tasks.length > 0 &&
			hasAnyActivePlan(task.sub_tasks)
		) {
			return true;
		}
	}

	return false;
}

const CSS_COUNTER_STYLE = { counterReset: "index" };

const isPlanStepValid = (task: PlanStep) => task.is_active && !!task.task;

function PlanMessageInner() {
	const organizationId = useWithOrganizationId();
	const notebookId = useDownloadedNotebookId();
	const approveBotPlan = useApproveBotPlan();
	const activePlan = useFetchBotPlan().data;
	const deleteBotPlan = useDeleteBotPlan();
	const isStreaming = useIsStreaming();
	const editBotPlan = useEditBotPlan();

	const { tasksRef, setIsEditing, isEditing, forceRender } = useTasks();

	const [isPlanMessageOpen, setIsPlanMessageOpen] = useReducer(
		(prev: boolean, next: boolean) => {
			const isClosing = next === false && prev;

			if (isClosing) {
				setIsEditing(false);
			}

			return next;
		},
		true,
	);

	if (!activePlan || !hasAnyActivePlan(activePlan.sub_tasks ?? [])) {
		return null;
	}

	function handleApprovePlan() {
		if (approveBotPlan.isPending || !activePlan) return;

		const sub_tasks: EditBotPlanRequestProps["body"]["sub_tasks"] =
			tasksRef.current.filter(isPlanStepValid).map((item) => ({
				sub_tasks: item.sub_tasks?.filter(isPlanStepValid) ?? [],
				is_current_task: item.is_current_task,
				task: item.task!,
			}));

		approveBotPlan.mutate({
			bot_conversation_id: activePlan.bot_conversation.id,
			organizationId,
			notebookId,
			body: {
				execute_plan: true,
				approved: true,
				sub_tasks,
			},
		});
	}

	function handleDenyPlan() {
		if (deleteBotPlan.isPending || !activePlan) return;

		deleteBotPlan.mutate({
			bot_conversation_id: activePlan.bot_conversation.id,
			organizationId,
			notebookId,
		});
	}

	function handleEditPlan() {
		if (!activePlan || editBotPlan.isPending) return;

		// Send all sub tasks that are valid:
		const sub_tasks: EditBotPlanRequestProps["body"]["sub_tasks"] =
			tasksRef.current.filter(isPlanStepValid).map((item) => ({
				sub_tasks: item.sub_tasks?.filter(isPlanStepValid) ?? [],
				is_current_task: item.is_current_task,
				task: item.task!,
			}));

		editBotPlan.mutate({
			body: { approved: true, execute_plan: true, sub_tasks },
			bot_conversation_id: activePlan.bot_conversation.id,
			organizationId,
			notebookId,
		});
	}

	function handleCancelEditPlan() {
		tasksRef.current = structuredClone(activePlan?.sub_tasks) ?? [];

		setIsEditing(false);
	}

	function handleAddTask() {
		if (!activePlan) return;

		const now = createISODate();

		const newTaskAtRoot: PlanStep = {
			bot_conversation: { id: activePlan.bot_conversation.id },
			id: Date.now() as BotPlanStepId,
			plan_uuid: activePlan.plan_uuid,
			parent_step: { id: null },
			is_current_task: true,
			updated_at: now,
			created_at: now,
			is_active: true,
			is_root: true,
			step_num: 1,
			task: "",
		};

		tasksRef.current.push(newTaskAtRoot);

		forceRender();
	}

	const isPendingUserApproval =
		activePlan?.approval_status === PlanApprovalStatus.Pending && !isStreaming;

	const canEditPlan =
		activePlan &&
		(activePlan.approval_status === PlanApprovalStatus.Approved ||
			activePlan.approval_status === PlanApprovalStatus.Pending) &&
		!isStreaming;

	if (!canEditPlan) {
		setIsEditing(false);
	} else if (isPendingUserApproval) {
		setIsEditing(true);
	}

	const isAnyTaskActive = tasksRef.current.some((task) => task.is_active);

	return (
		<Popover onOpenChange={setIsPlanMessageOpen} open={isPlanMessageOpen}>
			<PopoverTrigger
				className={`fixed bottom-36 min-w-[94px] right-12 flex gap-2 max-w-fit items-center py-2 px-3 rounded-lg border-2 border-border-smooth shadow-lg shadow-black/20 button-hover ${
					isPendingUserApproval && !isPlanMessageOpen
						? "border-orange-400 text-orange-900 animate-bounce bg-orange-100"
						: "bg-secondary"
				}`}
				title="Click to open the current plan popover"
				data-is-open={isPlanMessageOpen}
			>
				<p>Plan</p>

				<Info className="size-6" />
			</PopoverTrigger>

			<PopoverContent
				className="simple-scrollbar max-h-[67vh] min-h-10 min-w-10 max-w-[70vw] flex flex-col gap-4 rounded-lg p-3 data-[is-pending-user-approval=true]:ring-2 data-[is-pending-user-approval=true]:ring-orange-400"
				data-is-pending-user-approval={isPendingUserApproval}
				sideOffset={5}
				align="end"
				side="top"
			>
				<div className="flex w-full gap-10 justify-between items-center">
					<span className="font-bold">{isEditing ? "Edit " : ""}Plan</span>

					<div className="flex gap-4 items-center">
						{isPendingUserApproval || isEditing ? null : (
							<Popover>
								<PopoverTrigger
									className="p-1 rounded-full button-hover"
									title="More options"
								>
									<Settings className="size-4 text-primary" />
								</PopoverTrigger>

								<PopoverContent
									className="flex flex-col gap-1 rounded-md border border-link/20 bg-popover p-1 shadow-lg shadow-black"
									side="bottom"
									align="end"
								>
									<button
										className="w-full px-4 rounded-xs py-1 button-hover disabled:opacity-40"
										onClick={() => setIsEditing(true)}
										title="Edit tasks of this plan"
										disabled={!canEditPlan}
									>
										Edit
									</button>
								</PopoverContent>
							</Popover>
						)}

						{isEditing ? (
							<Button
								title="Delete the whole plan with all tasks"
								className="px-4 text-xs font-normal"
								isLoading={deleteBotPlan.isPending}
								variant={ButtonVariant.GHOST}
								onClick={handleDenyPlan}
								size="xs"
							>
								Delete Plan
							</Button>
						) : null}
					</div>
				</div>

				<div className="flex flex-col gap-4" style={CSS_COUNTER_STYLE}>
					{tasksRef.current.map((task) => (
						// eslint-disable-next-line react-hooks/purity
						<Task key={Math.random()} taskId={task.id} />
					))}

					<footer
						className="flex data-[hidden=true]:hidden mt-2 gap-2 w-full justify-between items-center"
						data-hidden={!(isEditing || isPendingUserApproval)}
					>
						{isEditing && !isPendingUserApproval ? (
							<>
								<Button
									variant={ButtonVariant.DESTRUCTIVE}
									disabled={editBotPlan.isPending}
									onClick={handleCancelEditPlan}
									title="Discard changes"
								>
									Cancel
								</Button>

								{isEditing && !isAnyTaskActive ? (
									<Button
										variant={ButtonVariant.GHOST}
										onClick={handleAddTask}
										title="Add task"
									>
										<Plus className="size-4" />

										<span>Add task</span>
									</Button>
								) : null}

								<Button
									isLoading={editBotPlan.isPending}
									variant={ButtonVariant.SUCCESS}
									onClick={handleEditPlan}
									title="Save changes"
								>
									&nbsp;Sav{editBotPlan.isPending ? "ing..." : "e"}&nbsp;
								</Button>
							</>
						) : isPendingUserApproval ? (
							<>
								<Button
									title="Deny plan and stop generating"
									variant={ButtonVariant.DESTRUCTIVE}
									disabled={approveBotPlan.isPending}
									isLoading={deleteBotPlan.isPending}
									onClick={handleDenyPlan}
								>
									Den{deleteBotPlan.isPending ? "ying..." : "y"}
								</Button>

								{isEditing && !isAnyTaskActive ? (
									<Button
										variant={ButtonVariant.GHOST}
										onClick={handleAddTask}
										title="Add task"
									>
										<Plus className="size-4" />

										<span>Add task</span>
									</Button>
								) : null}

								<Button
									title="Approve plan and continue generating"
									isLoading={approveBotPlan.isPending}
									disabled={deleteBotPlan.isPending}
									variant={ButtonVariant.SUCCESS}
									onClick={handleApprovePlan}
								>
									Approv{approveBotPlan.isPending ? "ing..." : "e"}
								</Button>
							</>
						) : null}
					</footer>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export const PlanMessage = memo(function PlanMessage() {
	return (
		<EmptyFallbackSuspense>
			<TasksProvider>
				<PlanMessageInner />
			</TasksProvider>
		</EmptyFallbackSuspense>
	);
});
