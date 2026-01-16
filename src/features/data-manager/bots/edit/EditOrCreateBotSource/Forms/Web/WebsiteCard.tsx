import { AxiosError } from "axios";
import { X } from "lucide-react";
import { useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import { Input } from "#/components/Input";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { getErrorMessage } from "#/helpers/utils";
import { useIndexWebSource } from "#/hooks/mutation/use-index-web-source";
import { GeneralStatus, type Website } from "#/types/bot-source";

export const WebsiteCard: React.FC<{
  isOnSource: boolean;
  website: Website;
  urlIndex: number;
  handleUpdateWebsite: (index: number, value: string) => void;
  handleRemoveWebsite: () => void;
}> = ({ isOnSource, urlIndex, website, handleRemoveWebsite, handleUpdateWebsite }) => {
  const [isSendingIndexRequest, setIsSendingIndexRequest] = useState(false);

  const isIndexing = website.index_status === GeneralStatus.In_Progress;

  const indexWebSource = useIndexWebSource();

  const handleIndexWebsite = async () => {
    try {
      if (!website) {
        throw new Error("No website URL provided!");
      }

      setIsSendingIndexRequest(true);

      await indexWebSource.mutateAsync({
        website_url: website.website_url,
      });

      toast({
        title: "Website indexing in progress",
        variant: ToastVariant.Success,
      });
    } catch (error) {
      console.error("Error indexing website:", error);

      toast({
        description: error instanceof AxiosError ? error.response?.data : getErrorMessage(error),
        variant: ToastVariant.Destructive,
        title: "Failed to index Wesite!",
      });
    } finally {
      setIsSendingIndexRequest(false);
    }
  };

  return (
    <li className="flex w-full items-center gap-2">
      <Input
        onChange={(e) => handleUpdateWebsite(urlIndex, e.target.value)}
        defaultValue={website.website_url}
        name={`website-${urlIndex}`}
      />

      <div className="flex gap-2">
        {isOnSource ? (
          <Button
            className="h-10 data-[is-indexing=true]:bg-primary"
            isLoading={isSendingIndexRequest}
            variant={ButtonVariant.PURPLE}
            data-is-indexing={isIndexing}
            onClick={handleIndexWebsite}
            disabled={isIndexing}
          >
            Index{isSendingIndexRequest || isIndexing ? "ing..." : ""}
          </Button>
        ) : null}

        <Button
          variant={ButtonVariant.DESTRUCTIVE}
          onClick={handleRemoveWebsite}
          className="size-10 p-0"
          title="Remove website"
        >
          <X className="size-5" />
        </Button>
      </div>
    </li>
  );
};
