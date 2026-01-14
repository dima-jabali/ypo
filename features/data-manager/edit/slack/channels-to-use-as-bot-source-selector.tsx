import { useLayoutEffect, useState } from "react";
import { X } from "lucide-react";

import { Button, ButtonVariant } from "#/components/Button";
import { RadioGroup, RadioGroupItem } from "#/components/radio-group";
import { Separator } from "#/components/separator";
import {
	TagGroup,
	type TagGroupMinimumInterface,
	type TagGroupProps,
} from "#/components/tag-group";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { NO_MORE_ITEMS_TO_SELECT } from "#/features/assign-to/base-project-form/base-project-form";
import { useUpdateIntegration } from "#/hooks/mutation/use-update-integration";
import {
	DatabaseConnectionType,
	type DatabaseConnection,
	type SlackChannelWithName,
} from "#/types/databases";

type Props = {
	allChannels: SlackChannelWithName[] | undefined;
	connectionId: DatabaseConnection["id"];
	connectionType: DatabaseConnectionType;
	selectedChannels: SelectedChannel[];
	showRefreshButton?: boolean;
	showSaveButton?: boolean;
	disabled?: boolean;
	setSelectedChannels: React.Dispatch<React.SetStateAction<SelectedChannel[]>>;
	refreshAvailableChannels: () => Promise<unknown>;
};

export type SelectedChannel = TagGroupMinimumInterface & SlackChannelWithName;

const DEFAULT_ALL_CHANNELS: SlackChannelWithName[] = [];

enum RadioSelected {
	AllNonDirectMessagesChannels,
	AllPublicChannels,
	NoOptionSelected,
	AllChannels,
}

export const ChannelsToUseAsBotSourceSelector: React.FC<Props> = ({
	allChannels = DEFAULT_ALL_CHANNELS,
	showSaveButton = true,
	showRefreshButton,
	selectedChannels,
	connectionType,
	connectionId,
	disabled,
	refreshAvailableChannels,
	setSelectedChannels,
}) => {
	const [allNonDirectMessagesChannels, setAllNonDirectMessagesChannels] =
		useState<SelectedChannel[]>([]);
	const [radioSelected, setRadioSelected] = useState(
		RadioSelected.NoOptionSelected,
	);
	const [allPublicChannels, setAllPublicChannels] = useState<SelectedChannel[]>(
		[],
	);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const updateIntegration =
		useUpdateIntegration<DatabaseConnectionType.Slack>();

	useLayoutEffect(() => {
		const nextAllPublicChannels = allChannels.filter(
			(channel) => !channel.is_private,
		);

		setAllPublicChannels(nextAllPublicChannels);

		// ---

		const nextAllNonDirectMessagesChannels = allChannels.filter(
			/*
				In Slack nomenclature:

				- IM (Instant Message): This refers to a direct one-on-one conversation between you and another member. It's essentially a private chat between two people.

				- MPIM (Multiparty Instant Message): This is a group conversation, similar to a direct message, but with more than two participants. It allows for private communication among a select group of people.

				When using the Slack API, channels of type "im" correspond to direct message channels (one-on-one), while channels of type "mpim" correspond to multiparty direct message channels (group conversations).
			*/
			(channel) => channel.is_im === false && channel.is_mpim === false,
		);

		setAllNonDirectMessagesChannels(nextAllNonDirectMessagesChannels);
	}, [allChannels]);

	useLayoutEffect(() => {
		// If the user clicked the "All Channels" option, and then remove any
		// of the channels, we should update the radio button to un-toggle the
		// "All Channels" radio.

		switch (radioSelected) {
			case RadioSelected.AllChannels:
				if (allChannels.length !== selectedChannels.length) {
					setRadioSelected(RadioSelected.NoOptionSelected);
				}
				break;

			case RadioSelected.AllPublicChannels:
				if (allPublicChannels.length !== selectedChannels.length) {
					setRadioSelected(RadioSelected.NoOptionSelected);
				}
				break;

			case RadioSelected.AllNonDirectMessagesChannels:
				if (allNonDirectMessagesChannels.length !== selectedChannels.length) {
					setRadioSelected(RadioSelected.NoOptionSelected);
				}
				break;

			default:
				break;
		}
	}, [
		allNonDirectMessagesChannels.length,
		allPublicChannels.length,
		selectedChannels.length,
		allChannels.length,
		radioSelected,
	]);

	const handleSelectAllChannels = () => {
		if (radioSelected === RadioSelected.AllChannels) {
			setRadioSelected(RadioSelected.NoOptionSelected);
			setSelectedChannels([]);
		} else {
			setRadioSelected(RadioSelected.AllChannels);
			setSelectedChannels(allChannels);
		}
	};

	const handleSelectAllPublicChannels = () => {
		if (radioSelected === RadioSelected.AllPublicChannels) {
			setRadioSelected(RadioSelected.NoOptionSelected);
			setSelectedChannels([]);
		} else {
			setRadioSelected(RadioSelected.AllPublicChannels);
			setSelectedChannels(allPublicChannels);
		}
	};

	const handleSelectAllNonDirectMessagesChannels = () => {
		if (radioSelected === RadioSelected.AllNonDirectMessagesChannels) {
			setRadioSelected(RadioSelected.NoOptionSelected);
			setSelectedChannels([]);
		} else {
			setRadioSelected(RadioSelected.AllNonDirectMessagesChannels);
			setSelectedChannels(allNonDirectMessagesChannels);
		}
	};

	const handleExcludeAllPrivateChannelsFromCurrentSelection = () => {
		setSelectedChannels((prevSelectedChannels) =>
			prevSelectedChannels.filter((channel) => channel.is_private === false),
		);
	};

	const handleExcludeAllDirectMessageChannelsFromCurrentSelection = () => {
		setSelectedChannels((prevSelectedChannels) =>
			prevSelectedChannels.filter(
				(channel) => channel.is_im === false && channel.is_mpim === false,
			),
		);
	};

	const handleExcludeSharedChannelsFromCurrentSelection = () => {
		setSelectedChannels((prevSelectedChannels) =>
			prevSelectedChannels.filter((channel) => channel.is_ext_shared === false),
		);
	};

	const handleUpdateChannelsToUseAsSources = async () => {
		try {
			await updateIntegration.mutateAsync({
				channels_to_index: selectedChannels.map((c) => c.id),
				connection_type: connectionType,
				// Using `!` cause we assured above:
				connection_id: connectionId,
				sync_channels: true,
			});

			await refreshAvailableChannels();

			toast({
				title: "Channels successfully included",
				variant: ToastVariant.Success,
			});
		} catch (error) {
			console.error("Error sending channels to include:", error);

			toast({
				title: "Error sending channels to include",
				variant: ToastVariant.Destructive,
			});
		}
	};

	const handleRefreshAvailableChannels = async () => {
		try {
			setIsRefreshing(true);

			await refreshAvailableChannels();

			toast({
				variant: ToastVariant.Success,
				title: "Channels refreshed",
			});
		} catch (error) {
			console.error("Error refreshing available channels!", error);
		} finally {
			setIsRefreshing(false);
		}
	};

	return (
		<div className="flex flex-col gap-1">
			<div className="flex w-96 items-center justify-between pr-2">
				<p className="pl-2 font-bold">Channels to use as sources</p>
			</div>

			<div className="flex gap-2">
				<TagGroup<SelectedChannel>
					footer={
						<>
							<Separator className="mt-2" />

							<RadioGroup className="flex flex-col gap-0 mb-1 mt-2 *:px-4 *:py-1 *:gap-2 text-xs">
								<label className="flex items-center onfocus:underline active:brightness-150 button-hover rounded">
									<RadioGroupItem
										checked={radioSelected === RadioSelected.AllChannels}
										onClick={handleSelectAllChannels}
										value="All channels"
									/>

									<p>Select all channels</p>
								</label>

								<label className="flex items-center onfocus:underline active:brightness-150 button-hover rounded">
									<RadioGroupItem
										checked={radioSelected === RadioSelected.AllPublicChannels}
										onClick={handleSelectAllPublicChannels}
										value="All public channels"
									/>

									<p>Select all public channels</p>
								</label>

								<label className="flex items-center onfocus:underline active:brightness-150 button-hover rounded">
									<RadioGroupItem
										checked={
											radioSelected ===
											RadioSelected.AllNonDirectMessagesChannels
										}
										value="All channels that are not messages with other people"
										onClick={handleSelectAllNonDirectMessagesChannels}
									/>

									<p>Select all non-direct messages channels</p>
								</label>
							</RadioGroup>

							<div className="my-1 flex flex-col gap-1 px-1">
								<button
									className="px-3 py-2 button-hover rounded-md border border-border-smooth  text-xs text-start"
									onClick={handleExcludeAllPrivateChannelsFromCurrentSelection}
								>
									Exclude all <i className="font-bold">private</i> channels from
									current selection
								</button>

								<button
									className="px-3 py-2 button-hover rounded-md border border-border-smooth  text-xs text-start"
									onClick={
										handleExcludeAllDirectMessageChannelsFromCurrentSelection
									}
								>
									Exclude all <i className="font-bold">direct message</i>{" "}
									channels from current selection
								</button>

								<button
									className="px-3 py-2 button-hover rounded-md border border-border-smooth  text-xs text-start"
									onClick={handleExcludeSharedChannelsFromCurrentSelection}
								>
									Exclude all <i className="font-bold">externally shared</i>{" "}
									channels from current selection
								</button>
							</div>

							<p className="mx-auto my-1 tabular-nums text-sm text-primary">
								{selectedChannels.length}/{allChannels.length} channels selected
							</p>
						</>
					}
					renderRemovableItem={renderRemovableSelectedChannelItem}
					renderItemWhenDisabled={renderItemWhenDisabled}
					noMoreItemsToSelect={NO_MORE_ITEMS_TO_SELECT}
					setSelectedValues={setSelectedChannels}
					renderItem={renderSelectedChannelItem}
					selectedValues={selectedChannels}
					placeholder="Search channel"
					wrapperClassName="w-[400px]"
					allValues={allChannels}
					disabled={disabled}
					withSearch
					isMulti
				/>
			</div>

			<div className="mt-10 flex w-full items-center justify-between">
				{showRefreshButton ? (
					<Button
						title={`Refresh available ${connectionType} channels`}
						onClick={handleRefreshAvailableChannels}
						variant={ButtonVariant.OUTLINE}
						isLoading={isRefreshing}
						className="w-fit"
					>
						Refresh{isRefreshing ? "ing" : ""} available channels
						{isRefreshing ? "..." : ""}
					</Button>
				) : (
					<div></div>
				)}

				{showSaveButton ? (
					<Button
						onClick={handleUpdateChannelsToUseAsSources}
						isLoading={updateIntegration.isPending}
						variant={ButtonVariant.SUCCESS}
						className="w-fit"
					>
						Sav{updateIntegration.isPending ? "ing" : "e"} changes
						{updateIntegration.isPending ? "..." : ""}
					</Button>
				) : null}
			</div>
		</div>
	);
};

const renderSelectedChannelItem: TagGroupProps<SelectedChannel>["renderItem"] =
	(item, handleAddSelectedValue) => (
		<button
			className="w-full button-hover text-sm rounded p-2 flex transition-none overflow-hidden max-w-full onfocus:bg-blue-400/40 min-w-0"
			onPointerUp={() => handleAddSelectedValue(item)}
			title={item.name}
			key={item.id}
		>
			<span className="relative box-border block w-min items-center justify-center overflow-hidden text-primary whitespace-nowrap rounded-sm px-2 max-w-full truncate">
				{item.name}
			</span>
		</button>
	);

const renderItemWhenDisabled: TagGroupProps<SelectedChannel>["renderItemWhenDisabled"] =
	(item) => (
		<div /* Selected item container */
			className="relative box-border flex h-8 w-min items-center justify-center overflow-hidden whitespace-nowrap text-white rounded-sm bg-accent px-2 shadow-md shadow-black/15"
			key={item.id}
		>
			{item.name}
		</div>
	);

const renderRemovableSelectedChannelItem: TagGroupProps<SelectedChannel>["renderRemovableItem"] =
	(item, index, handleRemoveSelectedValue) => (
		<div /* Selected item container */
			className="relative box-border flex w-min items-center justify-center overflow-hidden rounded-sm bg-accent text-white shadow-md shadow-black/15"
			key={item.id}
		>
			<p className="max-w-52 truncate whitespace-nowrap px-2" title={item.name}>
				{item.name}
			</p>

			<button /* Remove item button */
				className="h-full p-2 transition-none onfocus:bg-destructive/80 onfocus:text-primary"
				onPointerUp={() => handleRemoveSelectedValue(index)}
				type="button"
			>
				<X className="size-4" />
			</button>
		</div>
	);
