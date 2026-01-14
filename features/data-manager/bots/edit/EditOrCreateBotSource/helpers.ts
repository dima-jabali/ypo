import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { BotSourceFormAction } from "#/types/bot-source";

export const EDIT_OR_CREATE_BOT_SOURCE_FORM_ID =
	"edit-or-create-bot-source-form-id";
export const IS_BOT_SOURCE_ARCHIVED_INPUT_NAME = "is-bot-source-archived";
export const BOT_SOURCE_DESCRIPTION_INPUT_NAME = "bot-source-description";
export const BOT_NAME_INPUT_NAME = "bot-name";

export const editOrCreateSuccessToast = (action: BotSourceFormAction) =>
	toast({
		title: `Bot source ${action === BotSourceFormAction.Create ? "created" : "updated"}!`,
		variant: ToastVariant.Success,
	});

export const noBotNameToast = () =>
	toast({
		title: "Bot name was not provided!",
		variant: ToastVariant.Destructive,
	});
