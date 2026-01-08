import { skipToken, useQuery } from "@tanstack/react-query"
import { invariant } from "es-toolkit"

import type { Tagged } from "type-fest"

export const GET_AWS_BASE64_FILE_ACTION = "GET_AWS_BASE64_FILE_ACTION"
export type Base64File = `data:${string};base64,${string}`
export type AwsBucket = Tagged<string, "AwsBucket">
export type AwsKey = Tagged<string, "AwsKey">

export type FetchAwsBase64FileProps = {
  aws_bucket: AwsBucket | null | undefined
  aws_key: AwsKey | null | undefined
  saveToFile?: boolean
}

export function useAwsBase64File({ aws_bucket, aws_key, saveToFile = false }: FetchAwsBase64FileProps) {
  const enabled = !!aws_bucket && !!aws_key

  return useQuery({
    staleTime: Number.POSITIVE_INFINITY,
    throwOnError: false,
    enabled,

    queryKey: [aws_bucket, aws_key, saveToFile],

    queryFn: enabled
      ? async () => {
          const formData = new FormData()
          formData.set("formId", GET_AWS_BASE64_FILE_ACTION)
          formData.set("aws_bucket", aws_bucket)
          formData.set("aws_key", aws_key)
          formData.set("saveToFile", saveToFile.toString())

          const res = await fetch("/api/actions", {
            body: formData,
            method: "POST",
          })

          const jsonString = await res.text()

          invariant(jsonString, "No JSON file content received!")

          return jsonString
        }
      : skipToken,

    meta: {
      errorTitle: "Error downloading AWS file!",
    },
  })
}
