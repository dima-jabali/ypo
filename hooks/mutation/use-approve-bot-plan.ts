import { useMutation } from "@tanstack/react-query";

import { queryKeyFactory } from "../query-keys";
import {
	useEditBotPlan,
	type EditBotPlanRequestProps,
} from "./use-edit-bot-plan";

const mutationKey = queryKeyFactory.post["approve-bot-plan"].queryKey;

export function useApproveBotPlan() {
	const editBotPlan = useEditBotPlan();

	return useMutation({
		mutationKey,

		mutationFn: async (props: EditBotPlanRequestProps) => {
			return await editBotPlan.mutateAsync(props);
		},

		meta: {
			successTitle: "Bot's plan approved successfully!",
			errorTitle: "Failed to approve bot's plan!",
		},
	});
}
