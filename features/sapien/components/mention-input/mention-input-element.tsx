import { MentionPlugin } from "@platejs/mention/react";
import { PlateElement } from "platejs/react";
import {
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ComponentProps,
} from "react";

import { toColumnMention } from "../column-options-popover/convert-string-to-plate-value";
import { CustomMentionPlugin } from "../../lib/plugins/CustomMentionPlugin";
import { useMentionablesStore } from "../../contexts/mentionables/mentionables-context";
import { cn } from "#/helpers/class-names";
import {
	InlineCombobox,
	InlineComboboxContent,
	InlineComboboxEmpty,
	InlineComboboxInput,
	InlineComboboxItem,
} from "#/components/inline-combobox";
import { stopPropagation } from "#/helpers/utils";

export const MentionInputElement = memo(
	({ className, ...props }: ComponentProps<typeof PlateElement>) => {
		const { children, editor, element } = props;

		const [search, setSearch] = useState("");

		const mentionsStore = useMentionablesStore();
		const mentionables = mentionsStore.use.mentionables();

		const onSelectItem = useCallback(
			(item: { key: string | number; text: string }) => {
				editor.tf.insertNodes({
					children: [{ text: toColumnMention(item.key) }],
					type: CustomMentionPlugin.key,
					key: MentionPlugin.key,
					value: item.text,
				});

				editor.tf.move({ unit: "offset" });

				const pathAbove = editor.api.block()?.[1];
				const isBlockEnd =
					editor.selection &&
					pathAbove &&
					editor.api.isEnd(editor.selection.anchor, pathAbove);

				if (isBlockEnd) {
					editor.tf.insertText(" ");
				}
			},
			[editor],
		);

		const mentionablesItems = useMemo(() => {
			const mentionablesItems: Array<React.ReactNode> = [];

			for (const column of mentionables) {
				const item = {
					text: `${column.name ?? ""} (id: ${column.id})`,
					key: column.id,
				};

				mentionablesItems.push(
					<InlineComboboxItem
						className="m-0 flex items-start justify-between gap-2 w-full h-fit py-0.5 transition-none rounded-sm group"
						onClick={() => onSelectItem(item)}
						value={item.text}
						key={item.key}
					>
						<span>{column.name ?? ""}</span>

						<span className="text-xs text-muted-foreground whitespace-nowrap group-hover:text-white group-data-[active-item=true]:text-white">
							{`(id: ${column.id})`}
						</span>
					</InlineComboboxItem>,
				);
			}

			return mentionablesItems;
		}, [mentionables, onSelectItem]);

		useEffect(() => {
			mentionsStore.setState({ isPopoverOpen: true });

			return () => {
				// Using a timer because read this value in a function after the component is unmounted!
				// So, we need to make sure the function reads as if this component is still mounted
				setTimeout(() => {
					mentionsStore.setState({ isPopoverOpen: false });
				}, 100);
			};
		}, [mentionsStore]);

		return (
			<PlateElement data-slate-value={element.value} as="span" {...props}>
				<InlineCombobox
					setValue={setSearch}
					showTrigger={false}
					element={element}
					value={search}
					trigger="@"
				>
					<span
						className={cn(
							"inline-block rounded-sm bg-muted/50 text-black px-1.5 py-0.5 align-baseline text-sm ring-ring focus-within:ring-2 pointer-events-auto",
							className,
						)}
					>
						<InlineComboboxInput />
					</span>

					<InlineComboboxContent
						className="my-1.5 flex flex-col bg-popover border p-1 gap-1 border-border-smooth shadow-black/20 shadow-xl simple-scrollbar pointer-events-auto"
						onWheel={stopPropagation}
					>
						<InlineComboboxEmpty>No results found</InlineComboboxEmpty>

						{mentionablesItems}
					</InlineComboboxContent>
				</InlineCombobox>

				{children}
			</PlateElement>
		);
	},
);
