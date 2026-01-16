import { useState, type RefObject } from "react";

import { DialogTitle } from "#/components/Dialog";
import { Input } from "#/components/Input";
import { StyledTextarea } from "#/components/styled-text-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/select";

type FormProps = {
  formRef: RefObject<HTMLFormElement | null>;
};

export function PostgresForm({ formRef }: FormProps) {
  const [authType, setAuthType] = useState("Password");

  return (
    <>
      <DialogTitle>Connect to Postgres</DialogTitle>

      <form className="flex flex-col gap-6 w-full mt-4" ref={formRef}>
        <fieldset className="flex flex-col gap-3">
          <h4 className="font-bold text-lg">General</h4>

          <div className="flex flex-col gap-1">
            <label className="text-sm" htmlFor="name">
              Name
            </label>

            <Input name="name" id="name" required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm" htmlFor="description">
              Description
            </label>

            <StyledTextarea name="description" id="description" required />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <h4 className="font-bold text-lg">Database</h4>

          <div className="flex flex-col gap-1">
            <label className="text-sm" htmlFor="host">
              Host & Port
            </label>
            <div className="grid grid-cols-[2fr_1fr] gap-2">
              <Input name="host" id="host" required placeholder="Host" />

              <Input name="port" id="port" type="number" required placeholder="Port" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm" htmlFor="database">
              Database
            </label>
            <Input name="database" id="database" required />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <h4 className="font-bold text-lg">Authentication</h4>

          <div className="flex flex-col gap-1">
            <label className="text-sm" htmlFor="type">
              Type
            </label>

            <Select name="type" onValueChange={setAuthType} defaultValue="Password">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select auth type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Password">Password</SelectItem>

                <SelectItem value="Certificate">Certificate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {authType === "Password" ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm" htmlFor="username">
                  Username
                </label>
                <Input name="username" id="username" required />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm" htmlFor="password">
                  Password
                </label>
                <Input name="password" id="password" type="password" required />
              </div>
            </>
          ) : null}

          {authType === "Certificate" ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm" htmlFor="username">
                  Username
                </label>
                <Input name="username" id="username" required />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm" htmlFor="password">
                  Password
                </label>
                <Input name="password" id="password" type="password" required />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm" htmlFor="sslCertificate">
                  SSL Certificate
                </label>
                <StyledTextarea name="sslCertificate" id="sslCertificate" required />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm" htmlFor="sslKey">
                  SSL Key
                </label>
                <StyledTextarea name="sslKey" id="sslKey" required />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm" htmlFor="sslPassword">
                  SSL Password
                </label>
                <StyledTextarea name="sslPassword" id="sslPassword" required />
              </div>
            </>
          ) : null}
        </fieldset>

        <fieldset className="flex items-center gap-2 mt-4">
          <Input className="size-4" id="permission_type" name="permission_type" type="checkbox" />
          <label className="text-sm" htmlFor="permission_type">
            Share this connection with my workspace?
          </label>
        </fieldset>
      </form>
    </>
  );
}
