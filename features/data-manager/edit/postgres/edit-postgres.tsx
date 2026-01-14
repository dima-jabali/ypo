import { DatabaseSource } from "#/features/database-source/database-source";
import { usePostgresConnection } from "#/hooks/fetch/use-fetch-all-database-connections";
import { BackToDataManager } from "../../back-to-data-manager";

export function EditPostgres() {
	const postgresConnection = usePostgresConnection();

	return (
		<div className="flex flex-col h-full gap-10">
			<div className="flex items-center gap-4">
				<BackToDataManager />

				<span className="text-3xl font-bold w-full">Postgres Connection</span>
			</div>

			<DatabaseSource conn={postgresConnection} />
		</div>
	);
}
