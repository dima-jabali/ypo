import { DialogDescription, DialogHeader, DialogTitle } from "#/components/Dialog";
import { Input } from "#/components/Input";
import { AIRTABLE_CONNECTION_NAME_INPUT_ID, AIRTABLE_PAT_INPUT_ID } from "./utils";

export const AirtableForm: React.FC<{
  formRef: React.RefObject<HTMLFormElement | null>;
}> = ({ formRef }) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Airtable Connection</DialogTitle>
      </DialogHeader>

      <DialogDescription>
        To add a Airtable connection, you need to to authorize BetterBrain to connect to your
        desired Airtable&apos;s workspace.
      </DialogDescription>

      <section title="How to create an auth token for Airtable" className="flex flex-col gap-4">
        <h4>
          <a
            title="Open Airtable official documentation about creating a Personal Access Token on a new tab"
            href="https://support.airtable.com/docs/creating-personal-access-tokens"
            className="hover:underline hover:text-link-hover underline-offset-2"
            target="_blank"
          >
            How to create an auth token for Airtable
          </a>
        </h4>

        <video
          onLoadStart={(e) => {
            (e.target as HTMLVideoElement).playbackRate = 1.5;
          }}
          className="aspect-video w-full"
          src="/airtable-auth-token.mp4"
          preload="none"
          autoPlay
          controls
          muted
          loop
        ></video>

        <details className="text-sm">
          <summary className="hover:underline cursor-pointer">
            Instructions on creating a token
          </summary>

          <div className="flex flex-col gap-4 pl-4 mt-2 [&_span]:font-bold tabular-nums">
            <p>
              <span>1. </span>
              From{" "}
              <a
                className="text-link hover:underline hover:text-link-hover visited:text-link-visited"
                href="https://airtable.com/create/tokens"
                target="_blank"
              >
                /create/tokens
              </a>
              , click the &quot;Create new token&quot; button to create a new personal access token.
            </p>

            <p>
              <span>2. </span>
              Give your token a unique name. This name will be visible in record revision history.
            </p>

            <p>
              <span>3. </span>
              Choose the{" "}
              <a
                className="text-link hover:underline hover:text-link-hover visited:text-link-visited"
                href="https://airtable.com/developers/web/api/scopes"
                target="_blank"
              >
                scopes
              </a>{" "}
              to grant to your token. This controls what API endpoints the token will be able to
              use.
            </p>

            <p>
              <span>4. </span>
              Click &quot;add a base&quot; to grant the token access to a base or workspace.
            </p>

            <p>
              <span>5. </span>
              You can grant access to any combination and number of bases and workspaces. You can
              also grant access to all workspaces and bases under your account. Keep in mind that
              the token will only be able to read and write data within the bases and workspaces
              that have been assigned to it.
            </p>

            <p>
              <span>6. </span>
              Once your token is created, we will only show it to you once, so we encourage you to
              copy it to your clipboard and store it somewhere safe. While you will be able to
              manage it in{" "}
              <a
                className="text-link hover:underline hover:text-link-hover visited:text-link-visited"
                href="https://airtable.com/create/tokens"
                target="_blank"
              >
                /create/tokens
              </a>
              , the sensitive token itself is not stored for security purposes.
            </p>
          </div>
        </details>
      </section>

      <form className="my-6 flex flex-col gap-4" ref={formRef}>
        <fieldset className="flex items-center gap-4">
          <label
            htmlFor={AIRTABLE_CONNECTION_NAME_INPUT_ID}
            className="whitespace-nowrap font-bold"
          >
            Airtable connection name:
          </label>

          <Input
            name={AIRTABLE_CONNECTION_NAME_INPUT_ID}
            id={AIRTABLE_CONNECTION_NAME_INPUT_ID}
            required
          />
        </fieldset>

        <fieldset className="flex items-center gap-4">
          <label className="whitespace-nowrap font-bold" htmlFor={AIRTABLE_PAT_INPUT_ID}>
            Airtable Personal Access Token:
          </label>

          <Input name={AIRTABLE_PAT_INPUT_ID} id={AIRTABLE_PAT_INPUT_ID} type="password" required />
        </fieldset>
      </form>
    </>
  );
};
