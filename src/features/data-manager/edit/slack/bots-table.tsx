import { useFetchBotsPage } from "#/hooks/fetch/use-fetch-bots-page";
import type { Bot } from "#/types/bot-source";
import type { SlackConnectionDataWithDefinedChannels } from "#/types/databases";

// export type SlackChannelWithName = SlackChannel & { name: string };

type Props = {
  connection: SlackConnectionDataWithDefinedChannels;
};

export function BotsTable({ connection }: Props) {
  const allBotsQuery = useFetchBotsPage();

  const allBots = allBotsQuery.data.pages.flatMap((p) => p.results);
  const allBotsOfConnection: Bot[] = [];

  for (const bot of allBots) {
    for (const commConfig of bot.communication_configs) {
      if (commConfig.custom_type_info.slack_connection_id === connection.id) {
        allBotsOfConnection.push(bot);
      }
    }
  }

  // 	const handleGoToEditBotPage = async (bot: Bot) => {
  // 		dispatch(setRedirectedFromPage(Page.Bots));
  // 		dispatch(setCurrentBotId(`${bot.id}`));
  //
  // 		router.push(`${Page.Bots}/edit`);
  // 	};

  return (
    <table className="w-full border-collapse border border-border-smooth">
      <thead className="bg-transparent">
        <tr>
          <th className="border border-border-smooth py-1 text-primary">Name</th>

          <th className="border border-border-smooth py-1 text-primary">Source channels</th>
        </tr>
      </thead>

      <tbody>
        {allBotsOfConnection.map((bot, index) => (
          <tr
            className="cursor-pointer transition-none odd:bg-alt-row hover:bg-button-hover"
            // onClick={() => handleGoToEditBotPage(bot)}
            // title="Click to edit"
            key={index}
          >
            <td className="border border-border-smooth px-2 py-1">{bot.name}</td>

            <td className="flex-wrap border border-border-smooth px-2 py-1">
              <div className="flex border-collapse flex-wrap gap-2">
                {bot.sources.map((source) => (
                  <span className="rounded-sm bg-slate-600 text-white px-2 py-1" key={source.id}>
                    {source.name}
                  </span>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
