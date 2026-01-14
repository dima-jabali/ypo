import { useJustFetchChatUsageData } from "../hooks/fetch/use-chat-fetch-usage-data";

export function WithUsageDashboardData({ children }: React.PropsWithChildren) {
	useJustFetchChatUsageData();

	return children;
}
