import { NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { AwsBucket, AwsKey } from "@/hooks/use-aws-base64-file";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
  const formData = await request.formData();
  const formId = formData.get("formId");

  console.log("[v0] AWS catchall POST started", { formId });

  try {
    const awsBucket = formData.get("aws_bucket") as AwsBucket;
    const awsKey = formData.get("aws_key") as AwsKey;
    const saveToFile = formData.get("saveToFile") === "true";
    const region = "us-west-1";

    console.log("[v0] Request parameters:", { awsBucket, awsKey, saveToFile, region });

    // Validate parameters
    if (
      !awsBucket ||
      !awsKey ||
      awsBucket === "undefined" ||
      awsBucket === "null" ||
      awsKey === "undefined" ||
      awsKey === "null"
    ) {
      console.error("[v0] Invalid parameters");
      return NextResponse.json(
        { error: "`aws_bucket` and `aws_key` are required parameters" },
        { status: 400 },
      );
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error(
        "[v0] Missing AWS credentials. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.",
      );
      return NextResponse.json(
        {
          error:
            "AWS credentials not configured. Please add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to your environment variables.",
        },
        { status: 500 },
      );
    }

    console.log("[v0] AWS credentials found, initializing S3 client...");

    // Fetch from S3
    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log("[v0] Fetching from S3...");

    const getObjectResponse = await s3.send(
      new GetObjectCommand({
        Bucket: awsBucket,
        Key: awsKey,
      }),
    );

    console.log("[v0] S3 response received");

    if (getObjectResponse.Body) {
      const jsonContent = await getObjectResponse.Body.transformToString();
      console.log("[v0] File content length:", jsonContent.length);

      if (saveToFile) {
        try {
          const dataDir = join(process.cwd(), "data");
          await mkdir(dataDir, { recursive: true });
          const filePath = join(dataDir, "similar-nodes.json");
          await writeFile(filePath, jsonContent, "utf-8");
          console.log("[v0] File saved successfully to:", filePath);
        } catch (error) {
          console.error("[v0] Error saving file:", error);
        }
      }

      return new Response(jsonContent, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      console.error("[v0] No Body in S3 response");
      return NextResponse.json({ error: "No file found in S3" }, { status: 404 });
    }
  } catch (error) {
    console.error("[v0] Error in AWS POST route:", error);

    return NextResponse.json(
      {
        error: "Error fetching file from S3",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
